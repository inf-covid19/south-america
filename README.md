# covid-19


ESTRUTURA DE DIRETÓRIOS
-------------------------

    | data/                     datasets de metadados de pesquisas relacionadas ao COVID-19, em formato JSON (13202 papers)
    | grobid-client-python/     API para acesso ao GROBID como serviço
    | out/                      pequeno dataset com metadados de pesquisas relacionadas ao COVID-19, em formato XML (43 papers)
    | clean_out/                dataset out pré-processado 
    | virus2vec/                estrutura de pastas das classes do módulo Virus2Vec (@todo encapsular código dos notebooks)
    | models/                   modelo virus2vec pré-treinado
    | sgns_proj/                dados da projeção no tensorboard (@todo metadata.tsv deve ser movido pra cá)
    | covid-data.ipynb          pré-processamento do abstract e corpo dos papers. Como resultado gera o arquivo paper_data.pkl no diretório data.
    | xml_clean_data.ipynb      (@author Maritza Lapa) limpa o conteúdo dos metadados dos papers do dataset out e armazena os dados pré-processados em clean_out/  
    | xml_to_plain_text.ipynb   pré-processamento do dataset limpo em clean_out/ (@todo esses dados ainda não foram utilizados)
    | virus2vec.ipynb           algumas estatísticas sobre o conjunto de documentos montados em covid-data.ipynb e treinamento dos embeddings
    | virus2vec-vis-tool.ipynb  uso dos embeddings pré-treinados para montagem de uma projeção com o tensorboard
    | metadata.tsv              arquivo no notebook virus2vec.ipynb com informações sobre item|label dos pontos na projeção (@todo dados não categorizados por enquanto @todo2: esse arquivo deve ser enviado para sngs_proj/)
    | LICENSE                   licença do código-fonte 
    
    
REQUISITOS
-----------

Requisitos mínimos do projeto:

- python 3.7.5
- pip    20.0
- tensorflow 2.1
- tensorflow-gpu 2.1
- tensorflow-estimator 2.1
- tensorboard 2.1.1
- tensorflow-addons 0.8.3
- numpy 1.16.2
- matplotlib 3.0.2
- nltk 3.4.5
- gensim 3.8.1
- pandas 0.25.3
- seaborn 0.9.0

## Conjunto de dados:

Basicamente temos dois _datasets_, o primeiro é um conjunto de metadados de papers científicos relacionados 
ao coronavirus, obtidos no [COVID-19 Open Research Dataset, CORD-19](https://pages.semanticscholar.org/coronavirus-research).
São 13.202 papers publicados ou pré-prints até a data de 13-03-2020.

Esse conjunto, fica localizado no diretório data e são compostos de arquivos json compactados em .tar.gz. 
O arquivo paper_data.pkl contém os dados pré-processados. 

O segundo conjunto contém metadados de 43 artigos, obtidos manualmente em pesquisas no [Google Scholar](https://scholar.google.com.br/), 
em formato XML. Esse conjunto não foi utilizado ainda. Um coletor está sendo feito em outro ramo para localizar papers em formato PDF na web.
Esses papers passarão por um processo de extração dos metadados com o grobid, limpeza e pré-processamento.

## _TODO_LIST_

- Melhorar a limpeza dos dados
    - deduplicar termos utilizando métricas de similaridade entre palavras
- Enumerar categorias para procurar dentro dos documentos
    - ex.: genes, países, fármacos, outras características
- Localizar entidades nomeadas dentro dos documentos para formar conjuntos de analogias
    -    utilizar o pacote [scipspacy](https://github.com/allenai/scispacy)
- Analisar quais dados são mais relevantes para plotar na projeção, visto que há limitações de pontos na projeção.
- Fazer índice reverso dos termos relevantes e em quais documentos aparecem.