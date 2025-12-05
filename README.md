# InsightFlow

A modern, responsive SaaS website and dashboard for business analytics.

## Features

- **Landing Page**: Complete marketing site with Hero, Features, Use Cases, Pricing, and FAQ.
- **Dashboard**: Interactive dashboard with key metrics, charts, and transaction history.
- **Analytics**: Advanced reporting views with cohort analysis and comparison charts.
- **Data Sources**: Interface for managing data connections and file uploads.
- **Settings**: User profile and application preferences (including Dark Mode).
- **Support**: Help center and contact form.

## Tech Stack

- **HTML5**: Semantic structure.
- **CSS3**: Custom properties (variables), Flexbox, Grid, and responsive media queries. No frameworks used (Vanilla CSS).
- **JavaScript**: ES6+ for logic, Chart.js for data visualization, Feather Icons for UI icons.

## How to Run

1.  Navigate to the project directory:
    ```bash
    cd /Users/robingautam/.gemini/antigravity/scratch/insight-flow
    ```

2.  Start a local server (e.g., using Python):
    ```bash
    python3 -m http.server 8087
    ```

3.  Open your browser and visit:
    [http://localhost:8087](http://localhost:8087)

## Project Structure

- `index.html`: Landing page
- `dashboard.html`: Main app dashboard
- `analytics.html`: Analytics & Reports
- `data.html`: Data Sources
- `settings.html`: Settings & Profile
- `support.html`: Help & Support
- `css/style.css`: Main stylesheet
- `js/main.js`: Main application logic
- `js/data.js`: Dummy data generator
