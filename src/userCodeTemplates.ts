export const backtraderTemplate = `import backtrader as bt

# strategy class definition
class MyStrategy(bt.Strategy):
    params = ()
    
    def __init__(self):
        pass
    
    def next(self):
        pass


# cerebro configuration
def cerebro_init(cerebro: bt.Cerebro):
    # data = bt.feeds.YahooFinanceData()
    # cerebro.adddata(data)
    pass


# no driver code needed
`;

export const vectorbtTemplate = `import vectorbt as vbt

# strategy class definition
class MyStrategy(vbt.Strategy):
    params = ()
    
    def __init__(self):
        pass
    
    def next(self):
        pass
`;