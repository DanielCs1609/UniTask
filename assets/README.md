# 📁 Assets - Recursos da Aplicação

Esta pasta pode conter recursos estáticos da aplicação:

## 📋 Tipos de Arquivos Suportados

### Imagens

- Logo (logo.png, logo.svg)
- Ícones (icons/)
- Banners (banners/)
- Screenshots (screenshots/)

### Tamanhos Recomendados

| Tipo   | Tamanho     | Formato | Uso            |
| ------ | ----------- | ------- | -------------- |
| Logo   | 512x512px   | PNG/SVG | Header         |
| Ícone  | 64x64px     | PNG/SVG | Favicon        |
| Banner | 1920x1080px | PNG/JPG | Página inicial |
| Avatar | 256x256px   | PNG     | Perfil usuário |

## 🎨 Como Usar

### No HTML

```html
<img src="assets/logo.png" alt="UniTask Logo" />
```

### No CSS

```css
background-image: url("assets/banners/welcome.jpg");
```

## 📝 Exemplo de Estrutura

```
assets/
├── logo.png
├── favicon.ico
├── icons/
│   ├── task.svg
│   ├── plus.svg
│   └── settings.svg
├── images/
│   ├── banner.jpg
│   ├── background.jpg
│   └── pattern.png
└── screenshots/
    ├── mobile.png
    ├── desktop.png
    └── tablet.png
```

## 🚀 Otimizar Imagens

Para melhor performance:

1. **Comprimir imagens**
   - Use ferramentas como TinyPNG, Compressor.io
   - Mantenha < 200KB por imagem

2. **Usar formatos modernos**
   - PNG para logos
   - JPG para fotos
   - SVG para ícones

3. **Gerar múltiplos tamanhos**
   - Desktop: full size
   - Mobile: 50% da dimensão

## 📌 Nota

Os ícones podem ser criados usando:

- Font Awesome (CDN)
- Material Icons (CDN)
- Unicode Emoji (já inclusos no CSS)
- SVG customizado

O projeto atual usa emojis Unicode para simplificar, mas você pode adicionar ícones profissionais conforme necessário.
