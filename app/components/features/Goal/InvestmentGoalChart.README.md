# Investment Goal Chart Component (Recharts)

A fully accessible, mobile-responsive Recharts line chart for visualizing investment goal progress with real-time WebSocket updates.

## Features

- ✅ **WCAG 2.1 AA Compliant** - 4.5:1 minimum color contrast
- ✅ **Colorblind-Safe Palette** - Works with deuteranopia, protanopia, tritanopia
- ✅ **Screen Reader Support** - Full ARIA labels, live regions, and accessible data table
- ✅ **Keyboard Navigation** - Arrow keys to navigate data points, Escape to reset
- ✅ **Mobile Responsive** - Adapts to all screen sizes with 44px touch targets
- ✅ **Time Range Filtering** - Preset ranges (6M, 1Y, 3Y, 5Y, 10Y, All) + custom dates
- ✅ **Brush Zoom** - Drag handles below chart to zoom into date ranges
- ✅ **Real-Time Updates** - WebSocket integration for live portfolio data
- ✅ **Dynamic Tooltips** - Shows progress percentage (e.g., "Portfolio: 64% of 500,000 PLN target")
- ✅ **Toggle-able Legend** - Click legend items to show/hide lines

## No Additional Dependencies Required

This component uses **Recharts** which is already installed in your project (`recharts@^3.5.0`).

## Basic Usage

```tsx
import { InvestmentGoalChart } from '@/app/components/features/Goal';

<InvestmentGoalChart
  goal={goal}
  projectionData={projectionData}
  currentNetWorth={3200}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `goal` | `Goal` | required | Goal configuration object |
| `projectionData` | `ProjectionDataPoint[]` | required | Array of projection data points |
| `currentNetWorth` | `number` | required | Current portfolio value in PLN |
| `highContrastMode` | `boolean` | `false` | Enable higher contrast colors |
| `showProjected` | `boolean` | `true` | Show projected value line |
| `enableRealTimeUpdates` | `boolean` | `false` | Enable WebSocket connection |
| `websocketUrl` | `string` | - | WebSocket server URL for real-time updates |
| `className` | `string` | `''` | Additional CSS class |

## WebSocket Integration

To enable real-time updates:

```tsx
<InvestmentGoalChart
  goal={goal}
  projectionData={projectionData}
  currentNetWorth={3200}
  enableRealTimeUpdates={true}
  websocketUrl="ws://localhost:8080"
/>
```

### WebSocket Message Format

The component expects messages in this format:

```json
{
  "type": "portfolio_update",
  "netWorth": 3250.50,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Running the Example WebSocket Server

```bash
npx ts-node app/lib/websocket-server.example.ts
```

## Accessibility Features

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `→` Arrow Right | Move to next data point |
| `←` Arrow Left | Move to previous data point |
| `Home` | Jump to first data point |
| `End` | Jump to last data point |
| `Escape` | Reset zoom to default |
| `Tab` | Navigate between controls |

### Screen Reader Support

- Live region announces portfolio updates
- Full chart summary available via `aria-describedby`
- Data table alternative for non-visual access
- All interactive elements have proper ARIA labels
- Toggle-able legend with `aria-pressed` states

### Color Accessibility

Default palette (4.5:1+ contrast on dark background):

- Portfolio: `#4ECDC4` (Teal) - 8.2:1 contrast
- Target: `#FF9F43` (Orange) - 6.1:1 contrast  
- Contributions: `#8E7CC3` (Purple) - 4.7:1 contrast
- Projected: `#45B7D1` (Sky Blue) - 5.8:1 contrast

High contrast palette (for `highContrastMode={true}`):

- Portfolio: `#00FFD4`
- Target: `#FFB84D`
- Contributions: `#B399FF`
- Projected: `#66D9FF`

## Zoom Functionality

Instead of mouse wheel zoom (which Recharts doesn't support natively), this component uses the **Brush** component:

1. A draggable range selector appears below the chart
2. Drag the handles to select a date range
3. Click "Reset Zoom" or press Escape to reset

## Interactive Legend

Click on any legend item to toggle its visibility:

- **Portfolio Value** - Main line showing total portfolio value
- **Target Goal** - Dashed line showing target amount
- **Total Contributions** - Line showing cumulative deposits

Hidden items appear with strikethrough text and reduced opacity.

## Responsive Breakpoints

| Breakpoint | Chart Height | Layout Changes |
|------------|--------------|----------------|
| > 768px | 400px | Horizontal controls |
| 481-768px | 300px | Stacked controls, full-width buttons |
| ≤ 480px | 250px | Compact layout, vertical legend |

## Example Data Structure

```typescript
const goal: Goal = {
  amount: 500000,           // Target: 500,000 PLN
  targetYear: 2045,
  retirementYear: 2045,
  annualReturn: 0.07,       // 7% annual return
  monthlyDeposits: 2000,    // 2,000 PLN/month
  depositIncreasePercentage: 0.03,
  startDate: '2024-01-01',
};

const projectionData: ProjectionDataPoint[] = [
  {
    year: 2024,
    month: 1,
    date: '2024-01',
    value: 2000,
    goal: 500000,
    monthlyContribution: 2000,
    cumulativeContributions: 2000,
    monthlyReturn: 0,
    cumulativeReturns: 0,
    principalValue: 2000,
  },
  // ... more data points
];
```

## Comparison: Recharts vs Chart.js

| Feature | Recharts | Chart.js |
|---------|----------|----------|
| Bundle size | ~45kb | ~65kb + plugins |
| React integration | Native | Via wrapper |
| Declarative API | ✅ Yes | Imperative |
| Built-in responsive | ✅ Yes | Needs config |
| Mouse wheel zoom | ❌ No (use Brush) | ✅ With plugin |
| SSR support | ✅ Better | ⚠️ Requires setup |

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Tested with:
- NVDA screen reader
- VoiceOver (macOS/iOS)
- Windows High Contrast Mode
