import { Engine } from "./types";

export const backtraderTemplate = `import backtrader as bt

# Strategy class definition
class MyStrategy(bt.Strategy):
    params = ()
    
    def __init__(self):
        # sma1 = bt.ind.SMA(period=self.p.pfast)
        # sma2 = bt.ind.SMA(period=self.p.pslow)
        # self.crossover = bt.ind.CrossOver(sma1, sma2)
        pass
    
    def next(self):
        # if not self.position:
        #     if self.crossover > 0:
        #         self.buy()

        # elif self.crossover < 0:
        #     self.close()
        pass


# Cerebro configuration 
def cerebro_init(cerebro: bt.Cerebro):
    # data = bt.feeds.YahooFinanceData(dataname='MSFT',
    #                                  fromdate=datetime(2011, 1, 1),
    #                                  todate=datetime(2012, 12, 31))
    # cerebro.adddata(data)
    # ...

    pass


# No driver code (e.g. cerebro.run()) needed
# Backtrader Documentation: https://www.backtrader.com/docu/quickstart/quickstart/
`;

export const vectorbtTemplate = `import vectorbt as vbt

# Build portfolio args 
def portfolio_init() -> dict:
    portfolio_kwargs = {}
    
    # Example for from_signals()
    # price = vbt.YFData.download('BTC-USD').get('Close')
    # fast_ma = vbt.MA.run(price, 10)
    # slow_ma = vbt.MA.run(price, 50)

    # portfolio_kwargs['close'] = price
    # portfolio_kwargs['entries'] = fast_ma.ma_crossed_above(slow_ma)
    # portfolio_kwargs['exits'] = fast_ma.ma_crossed_below(slow_ma)
    # ...
    
    return portfolio_kwargs


# No driver code (e.g. vbt.Portfolio.from_signals()) needed
# VectorBT Documentation: https://vectorbt.dev/
`;

export function templateCodeFactory(engine: Engine): string {
  switch (engine) {
    case 'backtrader':
      return backtraderTemplate;
    case 'vectorbt':
      return vectorbtTemplate;
    default:
      return '';
  }
}