# Backtest Manager ✨

Hey there, trader! 👋 Looking to supercharge your trading strategy development? You're in the right place!

Backtest Manager is your new best friend for algorithmic trading strategy development - a powerful VSCode extension that makes backtesting as easy as a few clicks. No more juggling complex configurations or switching between different tools!

![VSCode Badge](https://img.shields.io/badge/vscode-marketplace-blue)
![Backtest Engine](https://img.shields.io/badge/engine-backtrader-orange)

## ✅ Why Use Backtest Manager?

Developing trading strategies can be complex and time-consuming. With Backtest Manager, you'll:
- **Save hours of setup time** - everything runs right in your favorite IDE
- **Visualize results instantly** - see how your strategies perform without extra tools
- **Iterate faster** - quickly tweak parameters and re-run tests in seconds
- **Focus on strategy logic** - not on technical setup or configuration hassles
- **Make better trading decisions** - backed by solid data and performance metrics

## 🌟 Key Features

- **Backtest Strategy Development & Management**: Create and manage backtest strategies directly within VSCode.
- **Visual Result Analysis**: View backtest results through gorgeous graphs and comprehensive statistical data.
- **Project Management**: Keep everything organized with easy project management tools.
- **Environment Variable Configuration**: Experiment freely by changing parameters on the fly.
- **AI Assistance**: Leverage VSCode's AI capabilities to write smarter, more optimized strategy code.

## 🚀 Currently Supported Engines

- [Backtrader](https://www.backtrader.com/) - Python-based backtesting framework

## 🔮 Planned Support for Future Engines

- [LEAN Engine (QuantConnect)](https://www.quantconnect.com/)
- [vectorbt](https://vectorbt.dev/)
- [Nautilus Trader](https://nautilustrader.io/)

## 🚦 Getting Started

### 📋 Installation Requirements

- Visual Studio Code 1.98.0 or higher
- Python 3.7 or higher
- Backtrader library

```bash
pip install backtrader
```

### 💻 Extension Installation

1. Search for 'Backtest Manager' in the VSCode marketplace
2. Install the extension
3. Restart VSCode

## 📚 How to Use

### 🆕 Creating a New Project

Just a few clicks and you're ready to start building your trading empire:
1. Click on the Backtest Manager icon in the activity bar
2. Click the 'Create New Project' button
3. Enter a project name (a basic template will be automatically generated)

### ✍️ Writing Strategies

Backtest Manager provides a basic template, and you can write strategies with AI assistance. Get creative and let your trading ideas flow!

```python
import backtrader as bt

class MyStrategy(bt.Strategy):
    params = (
        ('period', 20),  # Moving average period
        ('riskpercent', 2),  # Risk percentage
    )
    
    def __init__(self):
        self.sma = bt.indicators.SimpleMovingAverage(self.data.close, period=self.params.period)
        
    def next(self):
        if not self.position:
            if self.data.close[0] > self.sma[0]:
                size = self.broker.getcash() * (self.params.riskpercent / 100) / self.data.close[0]
                self.buy(size=size)
        else:
            if self.data.close[0] < self.sma[0]:
                self.sell()

# cerebro configuration
def cerebro_init(cerebro: bt.Cerebro):
    # data = bt.feeds.YahooFinanceData()
    # cerebro.adddata(data)
    pass

# The extension automatically handles data and cerebro setup using the cerebro_init function
```

Each project must include the `cerebro_init` function, which allows the extension to handle data loading and cerebro configuration. This function is called automatically by the extension before running the backtest.

### ▶️ Running a Backtest

Testing your brilliant strategy ideas has never been easier:
1. Open and edit the strategy file
2. Click the backtest run button (or use the right-click menu in the project panel)
3. Adjust necessary parameters and settings
4. Click the 'Run Backtest' button and watch the magic happen!

### 📊 Result Analysis

Dive deep into your strategy's performance with comprehensive analytics:
- Equity curve graph - see your profits grow
- Performance metrics (total return, Sharpe ratio, maximum drawdown, win rate, etc.)
- Trade history (time, price, size, profit, etc.)

## 📷 Example Screens

### Backtest Settings Screen
![Backtest Settings Screen](placeholder_설정화면.png)

### Backtest Results Screen
![Backtest Results Screen](placeholder_결과화면.png)

### Project Management Screen
![Project Management Screen](placeholder_프로젝트화면.png)

## 📜 License

Distributed under the MIT License.

## 🤝 Contributing

Got ideas to make this even better? Issues and pull requests are always welcome! Contributors should check the issue tracker.

*Note: A Korean version of this README is available in the [README_ko.md](README_ko.md) file.* 🇰🇷
