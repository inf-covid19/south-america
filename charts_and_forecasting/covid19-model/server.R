#
# This is the server logic of a Shiny web application. You can run the
# application by clicking 'Run App' above.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

library(shiny)
library(dplyr)

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

# Define server logic required to draw a histogram
shinyServer(function(input, output) {

    setwd('/opt/covid19-analysis/charts_and_forecasting/forecasting/')
    df <- read.csv(file='total_cases.csv', header=TRUE)
    
    
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
            plot(y, main="Distribution of the cases",ylab="#Cases",xlab="Interval")
            lines(val, col='red')
            
        })
    })

})
