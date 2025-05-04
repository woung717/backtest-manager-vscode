# 백테스트 매니저 (Backtest Manager) ✨

안녕하세요, 트레이더 여러분! 👋 트레이딩 전략 개발을 더 쉽고 효율적으로 하고 싶으신가요? 바로 이 확장 프로그램이 도와드립니다!

백테스트 매니저는 알고리즘 트레이딩 전략 개발을 위한 여러분의 든든한 파트너입니다. 몇 번의 클릭만으로 백테스팅이 가능한 강력한 VSCode 확장 프로그램입니다. 이제 복잡한 설정이나 여러 도구를 번갈아 사용할 필요가 없습니다!

![VSCode 활성화 배지](https://img.shields.io/badge/vscode-marketplace-blue)
![백테스트 엔진](https://img.shields.io/badge/engine-backtrader-orange)

## ✅ 백테스트 매니저를 사용해야 하는 이유

트레이딩 전략 개발은 복잡하고 시간이 많이 소요됩니다. 백테스트 매니저를 사용하면:
- **설정 시간을 대폭 절약할 수 있습니다** - 모든 작업이 익숙한 IDE 안에서 이루어집니다
- **결과를 즉시 시각화할 수 있습니다** - 추가 도구 없이 전략 성능을 확인할 수 있습니다
- **더 빠르게 반복 개발이 가능합니다** - 매개변수를 빠르게 조정하고 몇 초 안에 다시 테스트할 수 있습니다
- **전략 로직에만 집중할 수 있습니다** - 기술적인 설정이나 구성 문제에 시간을 낭비하지 않습니다
- **더 나은 트레이딩 결정을 내릴 수 있습니다** - 탄탄한 데이터와 성능 지표를 기반으로 합니다

## 🌟 주요 기능

- **백테스트 전략 개발 및 관리**: VSCode 내에서 직접 백테스트 전략을 작성하고 관리합니다.
- **시각적 결과 분석**: 멋진 그래프와 종합적인 통계 데이터로 백테스트 결과를 확인할 수 있습니다.
- **프로젝트 관리**: 편리한 프로젝트 관리 도구로 모든 것을 체계적으로 관리할 수 있습니다.
- **환경변수 설정**: 매개변수를 자유롭게 변경하며 다양한 실험을 할 수 있습니다.
- **AI 지원**: VSCode의 AI 도움을 받아 더 스마트하고 최적화된 전략 코드를 작성할 수 있습니다.

## 🚀 현재 지원하는 엔진

- [Backtrader](https://www.backtrader.com/) - Python 기반 백테스팅 프레임워크

## 🔮 향후 지원 예정 엔진

- [LEAN Engine (QuantConnect)](https://www.quantconnect.com/)
- [vectorbt](https://vectorbt.dev/)
- [Nautilus Trader](https://nautilustrader.io/)

## 🚦 시작하기

### 📋 설치 요구사항

- Visual Studio Code 1.98.0 이상
- Python 3.7 이상
- Backtrader 라이브러리

```bash
pip install backtrader
```

### 💻 확장 설치

1. VSCode 마켓플레이스에서 'Backtest Manager' 검색
2. 확장 설치
3. VSCode 재시작

## 📚 사용 방법

### 🆕 새 프로젝트 생성

몇 번의 클릭만으로 여러분의 트레이딩 제국을 건설할 준비가 완료됩니다:
1. 활동 바의 Backtest Manager 아이콘 클릭
2. '새 프로젝트 생성' 버튼 클릭
3. 프로젝트 이름 입력 (기본 템플릿이 자동으로 생성됩니다)

### ✍️ 전략 작성

백테스트 매니저는 기본 템플릿을 제공하며, AI의 도움을 받아 전략을 작성할 수 있습니다. 창의력을 발휘하고 다양한 트레이딩 아이디어를 마음껏 펼쳐보세요!

```python
import backtrader as bt

class MyStrategy(bt.Strategy):
    params = (
        ('period', 20),  # 이동평균선 기간
        ('riskpercent', 2),  # 리스크 비율
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

# cerebro 설정
def cerebro_init(cerebro: bt.Cerebro):
    # data = bt.feeds.YahooFinanceData()
    # cerebro.adddata(data)
    pass

# 데이터 및 세레브로 설정은 확장 프로그램이 cerebro_init 함수를 사용하여 자동으로 처리합니다
```

각 프로젝트는 반드시 `cerebro_init` 함수를 포함해야 합니다. 이 함수를 통해 확장 프로그램이 데이터 로딩 및 cerebro 설정을 처리할 수 있습니다. 백테스트 실행 전에 확장 프로그램이 이 함수를 자동으로 호출합니다.

### ▶️ 백테스트 실행

여러분의 멋진 전략 아이디어를 테스트하는 것이 이보다 쉬울 수 없습니다:
1. 전략 파일을 열고 편집
2. 백테스트 실행 버튼 클릭 (또는 프로젝트 패널에서 우클릭 메뉴 사용)
3. 필요한 매개변수 및 설정 조정
4. '백테스트 실행' 버튼을 클릭하고 마술 같은 결과를 지켜보세요!

### 📊 결과 분석

포괄적인 분석 도구로 여러분의 전략 성능을 깊이 있게 파악해 보세요:
- 자산 곡선 그래프 - 수익이 증가하는 과정을 확인하세요
- 성능 지표 (총 수익률, 샤프 비율, 최대 낙폭, 승률 등)
- 거래 내역 (시간, 가격, 수량, 수익 등)

## 📷 실행 예시 화면

### 백테스트 설정 화면
![백테스트 설정 화면](placeholder_설정화면.png)

### 백테스트 결과 화면
![백테스트 결과 화면](placeholder_결과화면.png)

### 프로젝트 관리 화면
![프로젝트 관리 화면](placeholder_프로젝트화면.png)

## 📜 라이센스

MIT 라이센스에 따라 배포됩니다.

## 🤝 기여

이 프로젝트를 더 좋게 만들 아이디어가 있으신가요? 이슈와 풀 리퀘스트는 언제나 환영합니다! 프로젝트에 기여하실 분들은 이슈 트래커를 확인해주세요. 