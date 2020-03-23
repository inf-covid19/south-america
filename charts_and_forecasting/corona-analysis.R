require(dplyr)
require(ggplot2)

setwd('covid19-analysis/charts_and_forecasting/')
df <- read.csv(file = 'forecasting/total_cases.csv', header=TRUE)

grouped_df <- df %>% group_by(date) %>% summarise_all(sum)
grouped_df[is.na(grouped_df)] <- 0.
grouped_df$day <- seq.int(nrow(grouped_df))

other_group <- rowSums(grouped_df[, !names(grouped_df) %in% c('date','day','World','China','Italy','Spain','Brazil'), drop = FALSE])

days <- c(1:80)

y_world <- grouped_df$World[(length(grouped_df$World)-length(days)+1):length(grouped_df$World)]
y_brazil <- grouped_df$Brazil[(length(grouped_df$Brazil)-length(days)+1):length(grouped_df$Brazil)]
y_china <- grouped_df$China[(length(grouped_df$China)-length(days)+1):length(grouped_df$China)]
y_italy <- grouped_df$Italy[(length(grouped_df$Italy)-length(days)+1):length(grouped_df$Italy)]
y_spain <- grouped_df$Spain[(length(grouped_df$Spain)-length(days)+1):length(grouped_df$Spain)]
y_other <- other_group[(length(other_group)-length(days)+1):length(other_group)]

days <- c(rep(days,6))
countries <- c(rep('world',80),rep('china',80),rep('italy',80),rep('spain',80),rep('brazil',80),rep('other',80))
counts <- c(y_world,y_china,y_italy,y_spain,y_brazil,y_other)

tbl_header <- c('day','country', 'counts')

data <- data.frame(days,countries,counts)
names(data) <- tbl_header

ggplot(data, aes(x=day,y=counts,color=countries)) +
  geom_line(stat='identity')


italy_data <- data[data$country=='italy',]

###
###  como ocorrem o aumento/diminuição da taxa de infecção do COVID-19
###

# Assumindo como ponto inicial a primeira observação dos infectados em uma região
a0 = italy_data[italy_data$counts>0,]$counts[1]

# assumindo que a_m(t) é a taxa de
# crescimento/decaimento médio da população infectada 
# em um período.
a_m <- function(t){
  tmp <- italy_data[italy_data$counts>0,]$counts
  return(tmp[t]-tmp[1])/t
};

###
### 
###   encontrar o melhor parâmetro k para um dado valor de a(t)
###
###   a(t) = a0*exp(k*t)
###
### por exemplo para 33
### a_m(33) = a0*exp(k*33)
### 1832 = 3*exp(k*33)
### ln(1832) = ln(3)+ln(exp(k*33))
### ln(1832/3) = ln(exp(k*33))
### ln(610.66) = k*33
### ln(610.66)/33 = k
### k =~ 0.1943
# função para retornar o melhor k
k_value <- function(t){
  return(log(a_m(t)/a0)/t)
}

### A(t) = a0*exp(0.1943*t)
a <- function(t,k){
  return(a0*exp(k*t))
}

comp=seq(40,100,1)
n=length(comp)


# qual o valor de k que descreve melhor
# a evoluçao da contaminação
n=80
val=c()
for(n in c(1:n)){
  val = c(val,a(n,k_value(24.199)))
}

plot(y_italy)
lines(val,col='red')
