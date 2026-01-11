# TMC Timer - Timer Assistant

A simple and beautiful timer assistant website with background color changes and doorbell sound alerts.

## Features

- 🎯 **Pre-built Templates** for common scenarios:
  - 🎤 **Prepared Speech**: 5m → 6m → 7m → 7m30s
  - 💬 **Table Topic**: 1m → 1m30s → 2m → 2m30s
  - 📋 **Individual Evaluation**: 2m → 2m30s → 3m → 3m30s
  - 🎯 **Keynote**: 10m → 15m → 20m (no bell)
- ⚙️ **Custom mode** for personalized time settings
- 🟢 Background turns green at Green Card Time
- 🟡 Background turns yellow at Yellow Card Time
- 🔴 Background turns red at Red Card Time
- 🔔 Plays doorbell sound (ding-dong) at Bell Ring Time - rings twice initially, then once every 5 seconds
- 🎨 80% of screen displays color during timing, control panel at bottom
- 📱 Responsive design, mobile-friendly
- 💫 Modern UI design with smooth transitions

## How to Use

### Quick Start with Templates

1. Open the `index.html` file
2. Choose a template from the main screen:
   - **Prepared Speech**: For 5-7 minute speeches
   - **Table Topic**: For 1-2.5 minute impromptu speeches
   - **Individual Evaluation**: For 2-3.5 minute evaluations
   - **Keynote**: For 10-20 minute presentations (no bell)
3. Timer starts immediately with preset times
4. Click "Stop Timer" to stop, or "Reset" to return to template selection

### Custom Mode

1. Click "Customize" on the template selection screen
2. Fill in the time fields as needed (each field has minute and second input boxes):
   - Green Card Time (optional)
   - Yellow Card Time (optional)
   - Red Card Time (optional)
   - Bell Ring Time (optional)
   - **Note: All fields are optional - only fill in what you need**
3. Click "Start Timer" to begin
4. Click "Back to Templates" to return to template selection

### During Timing

- The control panel moves to the bottom of the screen
- 80% of screen displays the background color
- Background color changes at each time point (Green → Yellow → Red)
- At Bell Ring Time, doorbell sound plays twice, then once every 5 seconds
- Click "Stop Timer" to stop the timer and sounds
- Click "Reset" to return to template selection

## Tech Stack

- HTML5
- CSS3 (modern gradients and animations)
- Vanilla JavaScript
- Web Audio API (for generating doorbell sounds)

## Running Locally

Simply open the `index.html` file in your browser - no server or build tools required.

## Notes

- Doorbell sound is generated using Web Audio API and requires user interaction (clicking Start button) for first playback
- Time format: minutes + seconds (e.g., 1:30)
- All time fields are optional - unfilled items will be skipped
- Recommended to set times in order: Green < Yellow < Red < Bell
- First bell rings twice (ding-dong ding-dong), then once every 5 seconds
- During timing, interface automatically adjusts to fullscreen mode with control panel fixed at bottom

