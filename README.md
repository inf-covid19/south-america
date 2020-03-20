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

