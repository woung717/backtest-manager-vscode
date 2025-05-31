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
def portfolio_init(close) -> dict:
    portfolio_kwargs = {}
    
    # Example for from_signals()
    # fast_ma = vbt.MA.run(close, 10)
    # slow_ma = vbt.MA.run(close, 50)

    # portfolio_kwargs['close'] = close
    # portfolio_kwargs['entries'] = fast_ma.ma_crossed_above(slow_ma)
    # portfolio_kwargs['exits'] = fast_ma.ma_crossed_below(slow_ma)
    # ...
    
    return portfolio_kwargs


# No driver code (e.g. vbt.Portfolio.from_signals()) needed
# VectorBT Documentation: https://vectorbt.dev/
`;

export const customEngineTemplate = `# Write backtesting code with your custom engine here.
# Don't forget to print your backtest results so that Backtest Manager can capture them.

"""
Print Format:
* Entry trade -
print("t: {
    'ref': int, 
    'datetime': str (e.g. "2024-05-30T14:00:00+00:00"), 
    'price': float, 
    'size': float, 
    'value': float, 
    'commission': float, 
    'side': str ('long' | 'short')
}")

* Exit trade -
print("t: {
    'ref': int,
    'datetime': str (e.g. "2024-05-30T14:00:00+00:00"),
    'price': float,
    'size': float,
    'pnl': float,
    'pnlcomm': float,
    'commission': float,
    ['hold_bars': int]
}")

* Equity - print("e: { 'datetime': str (e.g. "2024-05-30T14:00:00+00:00"), 'value': float }")
"""
`;

export function templateCodeFactory(engine: Engine): string {
  switch (engine) {
    case 'backtrader':
      return backtraderTemplate;
    case 'vectorbt':
      return vectorbtTemplate;
    case 'custom':
      return customEngineTemplate;
    default:
      return '';
  }
}