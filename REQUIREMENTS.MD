# Nala — Requisitos de Negócio

O **Nala** é uma plataforma de gestão estratégica de candidaturas profissionais, desenhada para centralizar, organizar e otimizar o processo de procura de emprego, eliminando o esforço manual e garantindo controle total sobre cada interação profissional.

> Este documento define **o quê** e **porquê** (contexto de produto). As decisões técnicas de **como** vivem em [AGENTS.MD](AGENTS.MD).

## 1. Proposta de Valor

- **Gestão de Contexto:** Acesso imediato a todos os detalhes de cada candidatura (Job Description e versão do CV enviado), facilitando a preparação para entrevistas.
- **Alinhamento Estratégico:** Aumento das taxas de sucesso através da adaptação inteligente do currículo para cada vaga específica.
- **Interoperabilidade:** Geração de documentos estruturados semanticamente, garantindo máxima legibilidade por sistemas automáticos de triagem (ATS) e facilidade de edição posterior em editores de texto.

## 2. Funcionalidades Principais (MVP 1)

### 2.1 Gestão de Candidaturas

- Criação de registro dedicado para cada vaga de interesse.
- Armazenamento centralizado da descrição da vaga (Job Description).
- Histórico consolidado de comunicações e notas sobre cada processo seletivo.

### 2.2 Otimização e Geração de Documentos

- Análise crítica da vaga para extração de requisitos e palavras-chave.
- Geração de currículos otimizados, priorizando a relevância para a vaga mantendo a integridade profissional.
- Criação automática de cartas de apresentação personalizadas.
- Exportação de documentos em formatos que preservam a hierarquia lógica, garantindo compatibilidade universal.

### 2.3 Central de Preparação

- Interface de consulta rápida ("Chat") vinculada a cada candidatura.
- Recuperação instantânea do histórico do processo para suporte pré-entrevista.
- Comparação direta entre o perfil enviado e os requisitos da vaga.

## 3. Padrões de Qualidade e Saída

- **Compatibilidade ATS:** Documentos otimizados para leitura por qualquer IA de triagem, sem erros de estrutura.
- **Editabilidade:** Layout limpo e hierárquico, permitindo conversão direta para formatos de edição (.docx) sem perda de formatação ou uso de elementos complexos (caixas de texto/tabelas flutuantes).
