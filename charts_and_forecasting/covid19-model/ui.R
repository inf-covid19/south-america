#
# This is the user-interface definition of a Shiny web application. You can
# run the application by clicking 'Run App' above.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

library(shiny)

setwd('/home/abel/workspace/dev/covid19-analysis/charts_and_forecasting/forecasting/')
df <- read.csv(file='total_cases.csv', header=TRUE)
countries <- names(df)[!names(df) %in% c('date','day')]

# Define UI for application that draws a histogram
shinyUI(fluidPage(

    # Application title
    titlePanel("Evolution of the COVID-19 contamination"),

    # Sidebar with a slider input for number of bins
    sidebarLayout(
        sidebarPanel(
            selectInput("select", label=h3("Choose a region:"),
                        choices=countries,
                        selected='Italy'),
            sliderInput("interval",label=h3("Time interval:"),min=1,max=80,step=1,value=c(32,80)),
            sliderInput('k', label=h3("parameter k:"),min=0,max=1,step=0.0001,value=0.0114)
        ),
        # Show a plot of the generated distribution
        mainPanel(
            plotOutput("distPlot")
        )
    )
))
