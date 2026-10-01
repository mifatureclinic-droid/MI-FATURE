import { describe, expect, it } from 'vitest';
import { cameraEstaPronta, mensagemErroGeolocalizacao } from '../shared/pontoDispositivo';

describe('preparação do dispositivo para o ponto eletrônico', () => {
  it('só libera a validação facial quando o vídeo tem dados suficientes', () => {
    expect(cameraEstaPronta(0)).toBe(false);
    expect(cameraEstaPronta(1)).toBe(false);
    expect(cameraEstaPronta(2)).toBe(true);
    expect(cameraEstaPronta(4)).toBe(true);
  });

  it('traduz erros de geolocalização em orientações acionáveis no telemóvel', () => {
    expect(mensagemErroGeolocalizacao(1)).toContain('bloqueada');
    expect(mensagemErroGeolocalizacao(2)).toContain('GPS');
    expect(mensagemErroGeolocalizacao(3)).toContain('demorou');
  });
});
