# Especificação funcional e técnica — Roleta de Sorteio

**Status:** requisitos consolidados para orientar a refatoração  
**Branch de referência:** `feature/architecture-refactor`  
**Escopo deste documento:** registrar o comportamento esperado antes da implementação. Este documento não significa que as funcionalidades já estejam implementadas.

## 1. Contexto e princípios

A aplicação continuará sendo uma aplicação web client-side, construída inicialmente com HTML5, CSS3 e JavaScript puro, sem autenticação, backend, pagamentos ou envio de arquivos para servidores.

Princípios:
- preservar os dados atuais durante a migração;
- manter a `main` intacta durante o desenvolvimento;
- priorizar compatibilidade, acessibilidade, responsividade e desempenho;
- armazenar dados e mídias localmente no navegador;
- separar estado da aplicação, interface, regras de negócio e serviços de persistência;
- preparar pontos de extensão para recursos Premium futuros, sem implementar bloqueios nesta fase.

## 2. Temas visuais

A aplicação terá cinco temas:

| Identificador sugerido | Nome exibido | Classificação |
|---|---|---|
| `light` | Claro | Gratuito |
| `dark` | Escuro | Gratuito |
| `glass` | Translúcido | Premium |
| `glass-light` | Branco translúcido | Premium |
| `glass-dark` | Preto translúcido | Premium |

### Regras de disponibilidade
- Antes da migração para domínio próprio, os cinco temas devem permanecer selecionáveis e utilizáveis.
- Não implementar bloqueios, paywall ou restrições de recursos Premium nesta fase.
- A classificação Premium deve existir apenas como metadado/configuração para futura evolução comercial.
- A migração para domínio próprio não será tratada como mecanismo de segurança. Qualquer controle comercial futuro exigirá autenticação e validação confiável de assinatura no servidor.

### Diretrizes visuais
- Os temas translúcidos devem utilizar superfícies semitransparentes e desfoque de fundo quando suportado.
- O tema Branco translúcido deve priorizar superfícies claras e texto escuro.
- O tema Preto translúcido deve priorizar superfícies escuras e texto claro.
- O tema Translúcido deve manter a identidade visual escura translúcida já existente.
- Contraste e legibilidade dos controles devem ser preservados sobre fundos estáticos e vídeos.
- Respeitar a preferência do sistema por redução de movimento nas animações não essenciais.

## 3. Estrutura da interface

### Barra superior
- Nome da aplicação alinhado à esquerda.
- Título da roleta atual centralizado em relação à área útil da barra, não apenas ao espaço restante entre os elementos.
- Ações globais, como configurações, podem ficar à direita.
- Em telas estreitas, reorganizar os elementos sem sobreposição ou perda de acesso.

### Área principal
- Preservar os painéis de itens, roleta e histórico, com adaptação responsiva.
- O título editável pertence à roleta atual e deve ser refletido no cabeçalho.
- A roleta deve permanecer visualmente destacada e com controles acessíveis.

### Barra inferior
- Reservar uma área para textos informativos, orientações, créditos e versão.
- Não deve encobrir controles ou conteúdo em telas pequenas.
- Seu conteúdo deve poder ser ampliado futuramente sem reestruturar a aplicação.

## 4. Duração da animação

Disponibilizar as opções:
- 5 segundos;
- 10 segundos;
- 15 segundos.

Regras:
- A duração selecionada controla o tempo da animação visual do giro.
- O resultado lógico é escolhido antes da animação e deve corresponder ao segmento indicado ao final.
- A preferência deve ser persistida por roleta.
- Valor padrão inicial: 5 segundos.
- A interface deve impedir novo giro enquanto a animação estiver em andamento.
- A duração deve ser aplicada de forma determinística, sem variar aleatoriamente dentro da opção selecionada.

## 5. Planos de fundo personalizados

A aplicação deverá aceitar imagem e vídeo como plano de fundo da experiência da roleta.

### Escopo de aplicação
Ao selecionar ou alterar um plano de fundo, apresentar duas opções:
1. **Somente esta roleta:** altera exclusivamente a roleta atualmente selecionada.
2. **Todas as roletas:** aplica o mesmo plano de fundo às roletas existentes e define esse plano como padrão para novas roletas.

Cada roleta poderá posteriormente receber um plano de fundo individual, substituindo a configuração global apenas para ela.

### Imagens
- Validar tipo MIME, extensão, dimensões e tamanho antes de armazenar.
- Usar IndexedDB para arquivos de imagem, evitando Data URLs grandes no localStorage.
- Manter opção para remover o fundo e retornar ao padrão.
- A interface deve informar os formatos e limites aceitos quando o usuário selecionar um arquivo.

### Vídeos — política inicial de compatibilidade e desempenho

| Propriedade | Política |
|---|---|
| Formato prioritário | MP4 |
| Codec prioritário | H.264/AVC |
| Formato alternativo | WebM, somente quando o navegador confirmar suporte ao codec do arquivo |
| Tamanho recomendado | Até 15 MB |
| Limite de tamanho | 30 MB |
| Resolução recomendada | 1280 × 720 |
| Resolução máxima recomendada | 1920 × 1080 |
| Duração recomendada | Até 30 segundos |
| Reprodução | Loop contínuo |
| Áudio | Sempre desativado |

Observações técnicas:
- Extensão e MIME type, isoladamente, não comprovam que o codec interno é compatível. A aplicação deve verificar suporte de reprodução no navegador e tratar falhas.
- Não realizar transcodificação no navegador nesta fase.
- Não aceitar arquivos acima do limite definido.
- Arquivos fora das dimensões ou duração recomendadas devem gerar aviso claro; a implementação pode rejeitá-los para manter o limite de desempenho.
- A aplicação deve usar reprodução silenciosa, inline e com comportamento de carregamento controlado.
- Evitar múltiplos elementos de vídeo ativos para o mesmo plano de fundo.
- Pausar ou suspender a reprodução quando a página estiver oculta, se isso puder ser feito sem comprometer o estado visual.
- O vídeo não pode bloquear eventos, controles ou animação da roleta.
- Em caso de falha de reprodução, mostrar o fundo padrão ou a imagem alternativa, sem interromper o sorteio.
- Exibir ao usuário as recomendações de formato, tamanho, resolução e duração junto ao seletor de arquivo.

### Armazenamento de mídia
- IndexedDB será o armazenamento primário de blobs de imagem e vídeo.
- localStorage guardará somente configurações e referências/identificadores, nunca os blobs grandes.
- Criar e revogar Object URLs corretamente para evitar retenção desnecessária de memória.
- Tratar quota excedida, indisponibilidade do IndexedDB e falhas de leitura/gravação com mensagens claras.
- Não enviar mídia para serviços externos.

## 6. Modelo de dados proposto

Estrutura conceitual versionada:

```js
{
  schemaVersion: 1,
  preferences: {
    theme: "dark",
    historyOrder: "newest",
    globalBackgroundId: null
  },
  activeWheelId: "uuid",
  wheels: [
    {
      id: "uuid",
      title: "Sorteio",
      mode: "geral",
      spinDurationSeconds: 5,
      background: {
        scope: "wheel",
        mediaId: null,
        mediaType: null
      },
      items: [],
      history: [],
      createdAt: "ISO-8601",
      updatedAt: "ISO-8601"
    }
  ]
}
```

Regras adicionais:
- Itens mantêm identificadores estáveis.
- Entradas de histórico mantêm identificador próprio, `itemId`, rótulo registrado no momento do sorteio, data e identificador de sessão.
- Preferências globais ficam separadas das configurações de cada roleta.
- O fundo global é uma configuração padrão; uma roleta pode ter uma substituição individual.
- A estrutura pode evoluir com novas versões de schema, sempre acompanhadas de migração explícita.

## 7. Migração e persistência

- Criar armazenamento versionado com a chave lógica `roleta-sorteio`.
- Detectar os dados legados existentes em `roleta-sorteio-v4`.
- Migrar os dados para o novo modelo sem apagar a chave antiga durante a primeira gravação.
- Validar a estrutura migrada antes de considerá-la concluída.
- Em falha, preservar os dados legados e informar o problema; não sobrescrever silenciosamente dados válidos.
- Separar persistência de metadados (localStorage) e blobs de mídia (IndexedDB).
- Testar dados ausentes, inválidos, antigos e armazenamento indisponível.

## 8. Histórico e modos de sorteio

- O histórico não deve ser apagado automaticamente apenas porque o usuário alternou entre os modos Geral e Eliminatório.
- Reiniciar uma rodada eliminatória deve restaurar os itens eliminados sem apagar registros históricos anteriores.
- Limpeza do histórico deve ocorrer somente por ação explícita do usuário.
- O modelo de sessão deve distinguir rodadas diferentes sem perder resultados anteriores.

## 9. Arquitetura e organização previstas

A implementação deverá migrar gradualmente para módulos, com responsabilidades separadas:
- núcleo: inicialização, estado e coordenação de eventos;
- módulos de interface e domínio: roleta, itens, histórico, configurações e efeitos;
- serviços: persistência, IndexedDB e seleção aleatória;
- utilitários: validação, criação segura de elementos DOM e formatação;
- testes: lógica de seleção, validação, migração e persistência.

A estrutura exata de diretórios será definida após mapear as dependências atuais de HTML, CSS e JavaScript. A refatoração deve ser incremental e manter a aplicação executável em cada etapa.

## 10. Escopo comercial futuro

Preparar a arquitetura para identificar recursos Premium, mas não implementar nesta fase:
- autenticação;
- backend;
- pagamentos ou assinaturas;
- bloqueios de funcionalidades;
- validação de plano.

Os três temas translúcidos são classificados como Premium para planejamento futuro. Enquanto a aplicação permanecer na fase atual de hospedagem, todos os temas permanecem livres e disponíveis.

## 11. Critérios de aceitação

A implementação futura será considerada concluída quando:
1. Os cinco temas puderem ser selecionados e persistirem após recarregar a página.
2. Os três temas translúcidos forem legíveis sobre fundos claros, escuros, imagens e vídeos.
3. A barra superior apresentar nome da aplicação à esquerda e título da roleta centralizado.
4. A barra inferior permanecer acessível sem sobrepor o conteúdo.
5. O usuário puder selecionar 5, 10 ou 15 segundos e a animação respeitar exatamente a duração escolhida.
6. O usuário puder aplicar imagem ou vídeo somente à roleta atual ou a todas as roletas.
7. Vídeos aceitos forem reproduzidos em loop e sem áudio, sem bloquear a interação com a roleta.
8. Arquivos incompatíveis, grandes ou não suportados forem recusados com orientação clara.
9. Mídias forem armazenadas no IndexedDB e configurações/metadados no armazenamento apropriado.
10. A migração preservar os dados antigos e puder ser testada sem perda de dados.
11. A troca de modo e o reinício eliminatório não apagarem o histórico sem ação explícita do usuário.
12. A aplicação continuar utilizável em desktop e dispositivos móveis.

## 12. Fora do escopo desta fase

- Login e cadastro de usuários.
- Sincronização em nuvem.
- Compartilhamento de roletas por conta.
- Pagamentos e gestão de assinaturas.
- Upload de mídia para servidor.
- Transcodificação automática de vídeos.
- Proteção efetiva de recursos Premium por servidor.

## 13. Sequência de implementação sugerida

1. Auditar o estado atual e mapear dependências.
2. Implementar persistência versionada e migração dos dados legados.
3. Separar armazenamento de blobs no IndexedDB.
4. Modularizar o JavaScript e reorganizar os arquivos.
5. Implementar modelo de múltiplas roletas e configurações por roleta.
6. Implementar temas, layout, duração do giro e fundos de imagem/vídeo.
7. Criar testes automatizados para regras críticas.
8. Atualizar README e documentação de uso.
9. Validar manualmente em desktop e dispositivos móveis antes de integrar à `main`.
