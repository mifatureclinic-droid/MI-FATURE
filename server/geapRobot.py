#!/usr/bin/env python3
"""
Robô RPA GEAP — Automação de Autorizações de Guias SP/SADT
Utiliza Playwright para navegar no portal da GEAP e submeter pedidos de autorização.

Uso:
  python3 geapRobot.py --autorizacao-id <id> --cpf <cpf> --senha <senha>

O script:
1. Faz login no portal GEAP (https://sisgeap.geap.com.br/portalprestador/)
2. Navega para o Portal TISS
3. Preenche o formulário de autorização com os dados fornecidos
4. Submete e captura o número de autorização
5. Retorna o resultado em JSON via stdout
"""

import sys
import json
import time
import argparse
import traceback
from datetime import datetime

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print(json.dumps({"success": False, "error": "Playwright não instalado. Execute: pip3 install playwright && playwright install chromium"}))
    sys.exit(1)

PORTAL_URL = "https://sisgeap.geap.com.br/portalprestador/"
LOGIN_URL = "https://login.geap.com.br/account/signin"

def log(msg):
    """Escreve log para stderr (não interfere com o JSON no stdout)"""
    print(f"[GEAP-RPA] {datetime.now().strftime('%H:%M:%S')} {msg}", file=sys.stderr, flush=True)

def fill_input_vue(page, selector, value):
    """
    Preenche um input em SPA Vue.js usando dispatchEvent para activar o v-model.
    O fill nativo do Playwright não funciona correctamente com Vue.js.
    """
    element = page.locator(selector).first
    element.click()
    element.fill("")
    time.sleep(0.1)
    # Simular digitação caractere por caractere para activar os watchers Vue
    for char in str(value):
        element.type(char, delay=30)
    # Disparar eventos para garantir que o Vue detecta a mudança
    page.evaluate(f"""
        var el = document.querySelector('{selector}');
        if (el) {{
            el.dispatchEvent(new Event('input', {{bubbles: true}}));
            el.dispatchEvent(new Event('change', {{bubbles: true}}));
        }}
    """)
    time.sleep(0.2)

def login_geap(page, cpf, senha):
    """Faz login no portal GEAP usando as credenciais fornecidas"""
    log(f"Iniciando login com CPF {cpf[:3]}***{cpf[-2:]}")
    
    page.goto(PORTAL_URL, wait_until="networkidle", timeout=30000)
    
    # Aguardar redireccionar para o login
    page.wait_for_url("**/account/signin**", timeout=15000)
    log("Página de login carregada")
    
    # Aguardar o campo CPF aparecer
    page.wait_for_selector("input[name='Username'], input[placeholder*='CPF'], input[type='text']", timeout=15000)
    
    # Preencher CPF
    cpf_input = page.locator("input[name='Username']").first
    if not cpf_input.is_visible():
        cpf_input = page.locator("input[type='text']").first
    
    cpf_input.click()
    cpf_input.fill("")
    cpf_input.type(cpf, delay=50)
    
    # Disparar eventos Vue
    page.evaluate("""
        var inputs = document.querySelectorAll('input[type="text"], input[name="Username"]');
        inputs.forEach(function(el) {
            el.dispatchEvent(new Event('input', {bubbles: true}));
            el.dispatchEvent(new Event('change', {bubbles: true}));
        });
    """)
    time.sleep(0.5)
    
    # Preencher senha
    senha_input = page.locator("input[name='Password'], input[type='password']").first
    senha_input.click()
    senha_input.fill("")
    senha_input.type(senha, delay=50)
    
    page.evaluate("""
        var inputs = document.querySelectorAll('input[type="password"], input[name="Password"]');
        inputs.forEach(function(el) {
            el.dispatchEvent(new Event('input', {bubbles: true}));
            el.dispatchEvent(new Event('change', {bubbles: true}));
        });
    """)
    time.sleep(0.5)
    
    # Clicar no botão de login
    login_btn = page.locator("button[type='submit'], button:has-text('Entrar'), button:has-text('Login')").first
    login_btn.click()
    
    # Aguardar redireccionar para o portal
    page.wait_for_url("**/portalprestador/**", timeout=20000)
    log("Login bem-sucedido, portal carregado")
    
    # Capturar token JWT do sessionStorage
    token_data = page.evaluate("""
        var key = 'oidc.user:https://login.geap.com.br:geap.portal.internet.prestador';
        var data = sessionStorage.getItem(key);
        if (data) {
            var parsed = JSON.parse(data);
            return {
                access_token: parsed.access_token,
                expires_at: parsed.expires_at
            };
        }
        return null;
    """)
    
    if token_data:
        log(f"Token JWT capturado, expira em {token_data.get('expires_at', 'N/A')}")
    
    return token_data

def navegar_portal_tiss(page):
    """Navega para o Portal TISS no menu lateral"""
    log("Navegando para Portal TISS")
    
    # Aguardar o menu lateral carregar
    page.wait_for_selector("[role='listitem']", timeout=15000)
    time.sleep(1)
    
    # Clicar no item Portal TISS do menu
    portal_tiss = page.locator("[role='listitem']").filter(has_text="Portal TISS").first
    portal_tiss.click()
    time.sleep(2)
    
    log("Portal TISS aberto")

def consultar_beneficiario(page, numero_carteira):
    """Consulta um beneficiário pelo número da carteirinha"""
    log(f"Consultando beneficiário com carteira {numero_carteira}")
    
    # Aguardar o formulário de consulta
    page.wait_for_selector("input", timeout=10000)
    
    # Procurar campo de carteirinha
    carteira_input = page.locator("input[placeholder*='carteira'], input[placeholder*='beneficiário'], input[placeholder*='carteirinha']").first
    if carteira_input.count() == 0:
        carteira_input = page.locator("input").first
    
    fill_input_vue(page, "input", numero_carteira)
    
    # Clicar em pesquisar
    pesquisar_btn = page.locator("button:has-text('Pesquisar'), button:has-text('Consultar'), button[type='submit']").first
    pesquisar_btn.click()
    time.sleep(2)
    
    log("Consulta de beneficiário realizada")

def preencher_formulario_autorizacao(page, dados):
    """
    Preenche o formulário de autorização de guia SP/SADT no Portal TISS.
    
    dados: dict com:
      - numero_carteira: str
      - codigo_tuss: str
      - cid10: str
      - quantidade_sessoes: int
      - data_inicio: str (YYYY-MM-DD)
      - data_fim: str (YYYY-MM-DD)
    """
    log("Preenchendo formulário de autorização")
    
    # Aguardar formulário carregar
    page.wait_for_selector("input, select", timeout=15000)
    time.sleep(1)
    
    # Número da carteirinha
    if dados.get("numero_carteira"):
        carteira_inputs = page.locator("input").all()
        for inp in carteira_inputs[:3]:  # tentar os primeiros campos
            try:
                placeholder = inp.get_attribute("placeholder") or ""
                if "carteira" in placeholder.lower() or "beneficiário" in placeholder.lower():
                    inp.fill(dados["numero_carteira"])
                    inp.dispatch_event("input")
                    inp.dispatch_event("change")
                    break
            except:
                pass
    
    # Código TUSS do procedimento
    if dados.get("codigo_tuss"):
        tuss_inputs = page.locator("input[placeholder*='TUSS'], input[placeholder*='procedimento'], input[placeholder*='código']").all()
        if tuss_inputs:
            tuss_inputs[0].fill(dados["codigo_tuss"])
            tuss_inputs[0].dispatch_event("input")
            tuss_inputs[0].dispatch_event("change")
            time.sleep(1)
            # Seleccionar da lista de sugestões se aparecer
            sugestao = page.locator(".q-item, li[role='option']").first
            if sugestao.is_visible():
                sugestao.click()
    
    # CID-10
    if dados.get("cid10"):
        cid_inputs = page.locator("input[placeholder*='CID'], input[placeholder*='diagnóstico']").all()
        if cid_inputs:
            cid_inputs[0].fill(dados["cid10"])
            cid_inputs[0].dispatch_event("input")
            cid_inputs[0].dispatch_event("change")
    
    # Quantidade de sessões
    if dados.get("quantidade_sessoes"):
        qtd_inputs = page.locator("input[placeholder*='quantidade'], input[placeholder*='sessões'], input[type='number']").all()
        if qtd_inputs:
            qtd_inputs[0].fill(str(dados["quantidade_sessoes"]))
            qtd_inputs[0].dispatch_event("input")
            qtd_inputs[0].dispatch_event("change")
    
    log("Formulário preenchido")

def submeter_autorizacao(page):
    """Submete o formulário de autorização e captura o número de autorização"""
    log("Submetendo autorização")
    
    # Clicar no botão de enviar/solicitar
    submit_btn = page.locator(
        "button:has-text('Solicitar'), button:has-text('Enviar'), button:has-text('Confirmar'), button[type='submit']"
    ).last
    submit_btn.click()
    
    # Aguardar resposta
    time.sleep(3)
    
    # Procurar número de autorização na resposta
    numero_autorizacao = None
    
    # Tentar encontrar o número na página
    try:
        # Procurar em elementos de texto que contenham "autorização" ou número
        autorizacao_text = page.locator("*:has-text('Autorização'), *:has-text('autorização')").all()
        for el in autorizacao_text:
            text = el.text_content() or ""
            # Procurar padrão de número de autorização (sequência de dígitos)
            import re
            matches = re.findall(r'\b\d{8,15}\b', text)
            if matches:
                numero_autorizacao = matches[0]
                break
    except:
        pass
    
    log(f"Autorização submetida. Número: {numero_autorizacao or 'não encontrado'}")
    return numero_autorizacao

def executar_autorizacao(cpf, senha, dados_autorizacao, headless=True):
    """
    Função principal que executa o fluxo completo de autorização.
    
    Retorna dict com:
      - success: bool
      - numero_autorizacao: str ou None
      - access_token: str ou None
      - error: str ou None
      - log: str
    """
    resultado = {
        "success": False,
        "numero_autorizacao": None,
        "access_token": None,
        "token_expires_at": None,
        "error": None,
        "log": []
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            # 1. Login
            token_data = login_geap(page, cpf, senha)
            if token_data:
                resultado["access_token"] = token_data.get("access_token")
                resultado["token_expires_at"] = token_data.get("expires_at")
            
            # 2. Navegar para Portal TISS
            navegar_portal_tiss(page)
            
            # 3. Preencher e submeter formulário
            if dados_autorizacao:
                preencher_formulario_autorizacao(page, dados_autorizacao)
                numero = submeter_autorizacao(page)
                resultado["numero_autorizacao"] = numero
            
            resultado["success"] = True
            resultado["log"].append("Fluxo concluído com sucesso")
            
        except PlaywrightTimeout as e:
            resultado["error"] = f"Timeout: {str(e)}"
            resultado["log"].append(f"ERRO TIMEOUT: {str(e)}")
            log(f"ERRO TIMEOUT: {str(e)}")
        except Exception as e:
            resultado["error"] = str(e)
            resultado["log"].append(f"ERRO: {str(e)}")
            resultado["log"].append(traceback.format_exc())
            log(f"ERRO: {str(e)}")
        finally:
            browser.close()
    
    return resultado

def main():
    parser = argparse.ArgumentParser(description="Robô RPA GEAP — Autorização de Guias")
    parser.add_argument("--cpf", required=True, help="CPF de login na GEAP")
    parser.add_argument("--senha", required=True, help="Senha de login na GEAP")
    parser.add_argument("--autorizacao-id", type=int, help="ID da autorização no sistema")
    parser.add_argument("--numero-carteira", help="Número da carteirinha do beneficiário")
    parser.add_argument("--codigo-tuss", help="Código TUSS do procedimento")
    parser.add_argument("--cid10", help="CID-10 do diagnóstico")
    parser.add_argument("--quantidade-sessoes", type=int, default=1, help="Quantidade de sessões")
    parser.add_argument("--data-inicio", help="Data de início (YYYY-MM-DD)")
    parser.add_argument("--data-fim", help="Data de fim (YYYY-MM-DD)")
    parser.add_argument("--headless", action="store_true", default=True, help="Executar em modo headless")
    parser.add_argument("--visible", action="store_true", help="Executar com browser visível")
    
    args = parser.parse_args()
    
    dados_autorizacao = None
    if args.numero_carteira or args.codigo_tuss:
        dados_autorizacao = {
            "numero_carteira": args.numero_carteira,
            "codigo_tuss": args.codigo_tuss,
            "cid10": args.cid10,
            "quantidade_sessoes": args.quantidade_sessoes,
            "data_inicio": args.data_inicio,
            "data_fim": args.data_fim,
        }
    
    headless = not args.visible
    resultado = executar_autorizacao(args.cpf, args.senha, dados_autorizacao, headless=headless)
    
    # Saída JSON para o processo pai (Node.js/tRPC)
    print(json.dumps(resultado, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
