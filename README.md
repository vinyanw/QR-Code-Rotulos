# QR Code Rotulagem Acessível

**Ferramenta de suporte ao projeto PIBIC:**  
**ROTULAGEM NUTRICIONAL PARA DEFICIENTES VISUAIS POR MEIO DO SISTEMA BRAILLE E QR CODES COM AUDIODESCRIÇÃO, NA CIDADE DE CAXIAS-MA**

---

## Sobre o Projeto

Este sistema foi desenvolvido como **ferramenta tecnológica de apoio** ao projeto de Iniciação Científica (PIBIC) da aluna **Alêsca Kamilly**, do curso de Ciência e Tecnologia de Alimentos.

O objetivo principal do projeto é **promover a inclusão de pessoas com deficiência visual** no acesso à informação nutricional de produtos alimentícios, combinando:

- **QR Codes** impressos nas embalagens
- **Audição** (áudio descrição em português com voz natural)

---

## 🎯 Objetivo da Ferramenta

Permitir que **fabricantes, produtores artesanais, cooperativas e pesquisadores** cadastrem facilmente as informações nutricionais de seus produtos e gerem **QR Codes acessíveis**, que ao serem escaneados reproduzem **narrativas claras e organizadas** sobre o produto por meio de áudio.

---

## ✨ Funcionalidades

### Painel Administrativo
- Cadastro completo de produtos alimentícios
- Campos conforme normas da Anvisa (tabela nutricional, porção, alertas frontais, ingredientes, alergênicos, armazenamento, etc.)
- Geração automática de **4 blocos narrativos** em linguagem simples e acessível
- Edição manual dos textos narrativos
- Geração e download do **QR Code**

### Página Pública (acessível via QR Code)
- Interface limpa e otimizada para leitura por voz
- **4 blocos narrativos** com navegação por botões e atalhos de teclado
- **Áudio com voz natural**:
  - Prioridade: Voz neural do Microsoft Edge (msedge-tts)
  - Fallback: Síntese de voz do navegador (Web Speech API)
- Exibição visual dos **selos de alerta** (Açúcar, Gordura Saturada e Sódio)
- Detalhes completos da tabela nutricional

### Recursos Técnicos
- Persistência de dados (SQLite local ou Turso)
- Cache inteligente de áudios
- Geração de QR Code de alta qualidade
- Totalmente responsivo
- Conformidade com boas práticas de acessibilidade (WCAG)

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **Banco de dados**: libSQL (Turso) / SQLite
- **Geração de QR Code**: `qrcode`
- **Síntese de voz em nuvem**: `msedge-tts` (vozes neurais gratuitas)
- **Frontend**: HTML, CSS (Tailwind) e JavaScript vanilla
- **Deploy recomendado**: Render.com (plano gratuito)

---

## 🚀 Como Rodar Localmente

### 1. Clone o repositório
```bash
git clone https://github.com/vinyanw/QR-Code-Rotulos.git
cd QR-Code-Rotulos
