library(shinydashboard)
library(dplyr)

df <- read.csv(file='total_cases.csv', header=TRUE)
countries <- names(df)[!names(df) %in% c('date','day')]

#
get_data <- function(df, interval, country){
  return(df[[country]][interval])
}

# média de crescimento/decaimento da infecção em um intervalo de dias
# params:
#   interval - vetor de intervalos de tempo.
#       eg.: c(20:40)
#            período inicial 20º dia término 40º dia
#            delta 40-20
#   y - observações no período
a_m <- function(y){
  return((y[length(y)]-y[1])/(length(y)-1))
}

# k-value para o período do intervalo
# recebe como parâmetros:
# a_e - valor estimado médio de crescimento/decaimento
# y_0 - valor inicial no intervalo
# period - duracao do intervalo em dias
k_value <- function(y_0,a_e,period){
  return(log(a_e/y_0)/period)
}

# funcao que retorna o valor inicial no periodo
# nesse caso, o valor inicial será o valor da primeira detecção
# de contaminação
a0 <- function(y){
  return(y[y>0][1])
}

# função que estima a taxa de crescimento/decaimento em um intervalo
# recebe um valor inicial y_0, um parâmetro k e um periodo de tempo (eg.: 20 dias)
a <- function(y0,x,k){
  return(y0*exp(k*x))
}

header <- dashboardHeader(
  title = "Evolução da contaminação por COVID-19 no Brasil"
)

body <- dashboardBody(
  fluidRow(
    column(width=9,
           fluidRow(
             box(width=NULL,solidHeader = TRUE,
                 plotOutput("distPlot"))
           )
         ),
  column(width=3,
         fluidRow(
           box(width=NULL, solidHeader = TRUE,
             selectInput("select", label=h3("Região:"), choices=countries, selected='Italy'),
             sliderInput("interval",label=h3("Time interval:"),min=1,max=80,step=1,value=c(32,80)),
             sliderInput('k', label=h3("parameter k:"),min=0,max=1,step=0.0001,value=0.1148)
           )
         )
       )
  )
)

ui <- dashboardPage(
  header,
  dashboardSidebar(disable = TRUE),
  body
)

server <- function(input, output){
  grouped_df <- df %>% group_by(date) %>% summarise_all(sum)
  grouped_df[is.na(grouped_df)] <- 0.
  grouped_df$day <- seq.int(nrow(grouped_df))
  
  observeEvent(input$interval,{
    interval <- c(input$interval[1]:input$interval[2])
    
    output$distPlot <- renderPlot({
      country = input$select
      #interval <- c(30:80)
      y <- get_data(grouped_df,interval,country)
      a_0 <- a0(y)
      #k <- k_value(a_0,a_m(y),(length(interval)-1))
      k <- as.double(input$k)
      val = c()
      for(x in interval){
        val <- c(val,a(a_0,x,k))
      }
      plot(y, main="Distribuição dos casos",ylab="#Casos",xlab="Intervalo")
      lines(val, col='red')
      
    })
  })
  
}

shinyApp(ui,server)