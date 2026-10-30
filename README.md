# Forja

Site local para pesquisa em etapas e criação de jogos. Digite uma combinação (por exemplo, `GTA 1 + Minecraft`); a Forja pesquisa cada referência separadamente, mostra os links encontrados durante a pesquisa, lê as páginas acessíveis, pede ao modelo uma análise separada de cada jogo e só então solicita um projeto combinado original e um jogo curto em HTML, feito para aquele pedido. O jogo aparece após as fontes e análises e pode ser jogado no site ou baixado. O servidor continua trabalhando enquanto o navegador acompanha as etapas e o progresso.

## Executar no Windows

Instale Python 3.10 ou superior, abra PowerShell nesta pasta e execute:

```powershell
python server.py
```

Abra `http://127.0.0.1:8000` no navegador. A máquina precisa de conexão com a internet. A pesquisa usa o DuckDuckGo HTML, não requer chave de busca e não é um acesso irrestrito à web: páginas privadas, protegidas por login, bloqueadas ou não compatíveis com leitura automática podem não estar disponíveis. Os trabalhos são mantidos em memória enquanto o servidor está ligado; reiniciá-lo interrompe pesquisas em andamento.

## Modelo de IA necessário para estudar e criar o jogo

Para a IA realmente estudar as referências e gerar o jogo, configure um serviço compatível com a API de chat completions em variáveis de ambiente **antes** de iniciar o servidor:

```powershell
$env:AI_BASE_URL = "https://seu-provedor.example/v1"
$env:AI_API_KEY = "sua-chave"
$env:AI_MODEL = "modelo-escolhido"
python server.py
```

O nome e a URL do modelo são escolha sua; não existe credencial ou provedor embutido. A chave fica no servidor local. O texto da ideia, os links e os trechos públicos consultados são enviados ao provedor escolhido. Sem modelo configurado, o site ainda pesquisa e mostra os links, mas não finge gerar um projeto estudado. Evite inserir informações privadas.

## Limites e originalidade

- Até 180 caracteres por consulta, dois temas, cinco resultados por tema (até dez fontes), até 400 KB lidos por página e timeout de oito segundos por página. Os links aparecem no site antes da análise do modelo.
- O modelo analisa separadamente cada referência, gera o jogo combinado e faz uma revisão de qualidade; cada chamada pode demorar até 120 segundos. Com duas referências, o processo pode levar vários minutos. O navegador acompanha o trabalho sem manter a solicitação inicial aberta.
- O site acessa fontes HTTPS públicas, não baixa jogos nem recupera conteúdo privado.
- A análise é baseada em texto público extraído de páginas e resultados de busca; não abre jogos, executa aplicativos, assiste a vídeos nem inspeciona conteúdo protegido.
- O modelo cria e revisa um protótipo curto, autônomo em HTML/CSS/JavaScript, limitado a 45 KB e sem recursos externos. No site roda num `iframe` isolado, com política de segurança que bloqueia conexões de rede. Não é um jogo comercial completo nem uma cópia dos jogos pesquisados.
- As propostas usam apenas ideias gerais. Crie identidade, personagens, cenários, mapas, áudio, arte e código próprios.
- A pesquisa demorada é um fluxo automatizado com chamadas a um modelo configurado, não uma IA consciente. A qualidade depende do modelo escolhido e das páginas públicas que ele consegue consultar.

## Testes

Execute os testes de parser e validação com:

```powershell
python -m unittest -v
```
