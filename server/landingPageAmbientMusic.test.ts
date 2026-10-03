import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landingPage = readFileSync(
  new URL("../client/src/pages/LandingPage.tsx", import.meta.url),
  "utf8"
);

describe("música ambiente na landing page", () => {
  it("oferece a faixa Amanhecer na Floresta com reprodução automática em loop", () => {
    expect(landingPage).toContain("amazonia-amanhecer-floresta_014d149b.mp3");
    expect(landingPage).toContain("<audio ref={audioRef} src={AMAZONIA_AMANHECER_AUDIO} loop autoPlay");
    expect(landingPage).toContain("void audio.play()");
  });

  it("oferece controle acessível para pausar ou retomar a música", () => {
    expect(landingPage).toContain('aria-label={label}');
    expect(landingPage).toContain('aria-pressed={isPlaying}');
    expect(landingPage).toContain('const toggleAmbientMusic = async () =>');
    expect(landingPage).not.toContain("disabled={audioUnavailable}");
    expect(landingPage).toContain('"Iniciar ambiente"');
  });

  it("restaura a imagem hero de pássaros sobre Manaus", () => {
    expect(landingPage).toContain("mifature-hero-manaus-passaros_2bd72c62.jpg");
  });

  it("anima pássaros e paisagem respeitando a redução de movimento", () => {
    expect(landingPage).toContain('className="hero-bird hero-bird-one"');
    expect(landingPage).toContain('className="hero-haze hero-haze-one"');
    expect(landingPage).toContain("@media (prefers-reduced-motion: reduce)");
    expect(landingPage).toContain("@keyframes hero-bird-glide-one");
  });

  it("mantém o controle musical separado da navegação para o Sistema", () => {
    expect(landingPage).toContain('left: 24');
    expect(landingPage).toContain('bottom: 24');
    expect(landingPage).toContain('zIndex: 45');
    expect(landingPage).toContain('z-50');
    expect(landingPage).toContain('<button\n                onClick={onSistema}');
  });
});
