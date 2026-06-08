# Axon Studio — Visual Neural Network Playground

Axon Studio is a modern browser-based machine learning playground built for visualizing, training, debugging, and comparing small neural networks directly inside the browser.

It is inspired by tools like TensorFlow Playground, but takes the idea further by focusing not only on the final model output, but also on the internal learning process. Axon Studio helps users see how a neural network learns through decision boundaries, misclassification debugging, train/test metrics, gradient flow, epoch snapshots, CSV import, saved experiments, and exportable runs.

The project runs completely client-side using TensorFlow.js, so users do not need a GPU, backend server, or local ML environment to experiment with neural networks.

---

## Preview



```md
![Axon Studio Landing Page](./public/screenshots/landing.png)
![Axon Studio Playground](./public/screenshots/playground.png)
![Axon Studio CSV Import](./public/screenshots/csv-import.png)
![Axon Studio Experiments](./public/screenshots/experiments.png)
```

---


## Repository

```txt
https://github.com/AyushKar2005/axonstudio
```

---

## What Axon Studio Does

Most ML playgrounds only show the final prediction boundary. Axon Studio is designed as a visual neural-network lab where users can inspect how learning actually happens.

With Axon Studio, users can:

* train neural networks directly in the browser
* visualize decision boundaries in real time
* inspect misclassified points
* click individual data points and view prediction details
* import custom 2D CSV datasets
* compare train and test accuracy
* inspect generalization gap
* monitor loss curves
* view weight heatmaps
* analyze layer and gradient flow
* scrub through epoch snapshots
* save and compare experiments
* export experiment data as JSON
* export the decision boundary as an image
* copy experiment summaries
* explore docs, examples, and saved experiments

---

## Key Features

### Browser-Based Training

Axon Studio uses TensorFlow.js to train neural networks directly inside the browser.

No backend training server is required.

Users can run, pause, reset, and step through training one epoch at a time.

---

### Neural Network Builder

Users can configure small neural networks visually.

Supported controls include:

* add hidden layers
* remove hidden layers
* change neuron count
* choose activation functions
* adjust learning rate
* adjust dataset noise

Supported activation functions:

* ReLU
* Sigmoid
* Tanh
* Linear

---

### Built-In Dataset Presets

Axon Studio includes common 2D binary classification datasets:

* XOR
* Circles
* Spiral
* Blobs

It also includes preset experiment configurations such as:

* XOR Compact
* Circles Clean
* Spiral Deep
* Linear Baseline

These presets make it easy to test how different model architectures behave on different data distributions.

---

### Custom CSV Dataset Import

Users can import their own 2D binary classification datasets using CSV files.

CSV import supports:

* drag-and-drop upload
* click-to-upload
* downloadable sample CSV
* auto-detection of X, Y, and label columns
* manual column selection
* column validation
* invalid row detection
* preview of the first 5 rows
* automatic normalization to `[-1, 1]`
* direct training on uploaded data

Expected CSV format:

```csv
x,y,label
0.12,0.88,0
-0.4,0.2,1
0.6,-0.1,0
```

Current CSV mode supports:

* 2 numeric feature columns
* 1 binary label column
* binary labels such as `0/1`, `true/false`, or two distinct class values

---

### Decision Boundary Visualization

The center visualization shows how the model separates the input space.

It displays:

* class regions
* training points
* test points
* learned decision boundary
* confidence regions
* misclassification indicators

The boundary updates as the model trains.

---

### View Modes

Axon Studio includes multiple visualization modes:

#### Boundary Mode

Shows the standard learned decision boundary.

#### Errors Mode

Highlights misclassified points so users can see where the model is failing.

#### Gradients Mode

Shows layer update behavior and gradient-flow style information to help users understand how learning is moving through the network.

---

### Misclassification Lens

The misclassification lens highlights incorrect predictions directly on the canvas.

This helps answer questions such as:

* Which points is the model getting wrong?
* Are errors near the boundary?
* Is the model underfitting?
* Is the dataset too noisy?
* Is the architecture too weak?

---

### Clickable Forward-Pass Inspector

Users can click any data point on the canvas and inspect how the model predicts that point.

The inspector shows:

* selected point coordinates
* actual class
* predicted class
* prediction probability
* model confidence
* layer-by-layer activations
* final output value

This makes Axon Studio more transparent than a basic ML playground.

---

### Train/Test Metrics

Axon Studio evaluates more than just training loss.

The playground displays:

* train accuracy
* test accuracy
* overall accuracy
* generalization gap
* mean confidence
* prediction split
* update norm
* examples per second
* misclassified count

This gives a more realistic understanding of model performance.

---

### Epoch Timeline

The playground saves snapshots during training.

Users can pause training and scrub through saved epochs to inspect how the model evolved over time.

Timeline snapshots include:

* epoch number
* loss
* decision boundary
* metrics
* predictions
* weights

This turns the playground into a model-learning microscope.

---

### Weight Heatmap

The right panel includes a heatmap of model weights.

It helps users understand:

* positive and negative weights
* weight magnitude
* how the model’s internal parameters evolve during training

---

### Layer Flow / Gradient Flow

Axon Studio includes a layer-flow view that gives insight into how strongly each layer is changing.

It helps users detect:

* weak updates
* unstable training
* low learning movement
* possible vanishing-gradient-like behavior
* inactive layers

---

### Explain Mode

Axon Studio includes a rule-based explain mode that gives practical feedback about the current training state.

Example insights include:

* the model may be underfitting
* the learning rate may be too high
* confidence is low
* the model is generalizing well
* the dataset may be noisy
* the architecture may need more capacity

This makes the playground more guided and beginner-friendly.

---

### Compare Experiments

Users can save runs locally and compare experiments later.

Saved runs include:

* dataset
* dataset name
* model architecture
* learning rate
* noise level
* epoch count
* loss
* accuracy metrics
* timestamp

Saved experiments are stored in the browser using `localStorage`.

---

### Export Features

Axon Studio supports experiment export options:

* export run as JSON
* export decision boundary screenshot as PNG
* copy experiment summary
* save run locally

These features make experiments easier to document, debug, and share.

---

### Resizable Panels

The playground uses a flexible three-panel interface:

* left panel for controls
* center panel for visualization
* right panel for metrics and inspection

Users can resize panels by dragging the separators.

Panel widths are persisted locally.

---

### Keyboard Shortcuts

Axon Studio includes keyboard shortcuts for faster experimentation.

| Shortcut         | Action                   |
| ---------------- | ------------------------ |
| `Space`          | Run / pause training     |
| `R`              | Reset model              |
| `S`              | Step one epoch           |
| `E`              | Switch to errors view    |
| `G`              | Switch to gradients view |
| `B`              | Switch to boundary view  |
| `Ctrl / Cmd + S` | Save current run         |

---

## Pages

### Landing Page

The landing page introduces Axon Studio with a dark startup-style aesthetic, large hero typography, neural visuals, and direct links to the playground, docs, examples, and experiments.

### Playground

The main ML lab where users train models, import datasets, inspect learning, compare runs, and export results.

### Docs

A documentation experience explaining how to use Axon Studio, how CSV import works, and how to interpret visualizations.

### Examples

A gallery of prebuilt experiment ideas and recommended configurations.

### Experiments

A saved-runs page where locally saved experiments can be reviewed.

---

## Tech Stack

Axon Studio is built with:

* Next.js
* TypeScript
* React
* Tailwind CSS
* TensorFlow.js
* Canvas API
* localStorage

Planned future backend stack:

* PostgreSQL
* Prisma
* Neon
* Vercel

---

## Project Structure

```txt
src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── playground/
│   │   └── page.tsx
│   ├── docs/
│   │   └── page.tsx
│   ├── examples/
│   │   └── page.tsx
│   └── experiments/
│       └── page.tsx
│
├── components/
│   ├── playground/
│   │   ├── PlaygroundLayout.tsx
│   │   ├── LeftPanel.tsx
│   │   ├── CenterPanel.tsx
│   │   ├── RightPanel.tsx
│   │   ├── BoundaryCanvas.tsx
│   │   ├── NetworkDiagram.tsx
│   │   ├── CsvImportPanel.tsx
│   │   ├── PointInspector.tsx
│   │   ├── CompareExperiments.tsx
│   │   ├── ExplainPanel.tsx
│   │   ├── ExportPanel.tsx
│   │   ├── LossChart.tsx
│   │   ├── Controls.tsx
│   │   ├── LayerCard.tsx
│   │   ├── ResizeHandle.tsx
│   │   ├── EpochTimeline.tsx
│   │   ├── TrainingControls.tsx
│   │   └── ui.ts
│   │
│   ├── site/
│   │   ├── SiteNav.tsx
│   │   ├── LandingNav.tsx
│   │   └── PageShell.tsx
│   │
│   └── experiments/
│       └── SavedExperimentsClient.tsx
│
└── lib/
    └── tf/
        ├── types.ts
        ├── datasets.ts
        ├── csv.ts
        ├── explain.ts
        ├── export.ts
        └── trainer.ts
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AyushKar2005/axonstudio.git
cd axonstudio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

### 4. Open the app

```txt
http://localhost:3000
```

---

## Build for Production

```bash
npm run build
```

Start production server locally:

```bash
npm start
```

---

## Deployment

Axon Studio is intended to be deployed on Vercel.

Recommended deployment flow:

```bash
git add .
git commit -m "Build Axon Studio ML playground"
git push
```

Then import the GitHub repository into Vercel.

---

## CSV Dataset Format

Axon Studio currently supports 2D binary classification datasets.

The recommended CSV format is:

```csv
x,y,label
0.12,0.88,0
-0.4,0.2,1
0.6,-0.1,0
```

Column names do not have to be exactly `x`, `y`, and `label`, because Axon Studio includes column selection. However, these names are recommended for auto-detection.

Rules:

* X column must be numeric
* Y column must be numeric
* label column must contain two classes
* invalid rows are skipped
* values are normalized automatically

---

## Why This Project Matters

Axon Studio is not just a UI project. It combines frontend engineering, ML visualization, client-side model training, interactive debugging, and product design.

It demonstrates:

* React application architecture
* Next.js App Router usage
* TypeScript-driven state management
* TensorFlow.js model training
* custom canvas visualizations
* CSV parsing and validation
* ML metric computation
* local experiment persistence
* export workflows
* product-style documentation and examples

---

## Roadmap

Planned improvements:

* cloud-saved experiments using PostgreSQL, Prisma, and Neon
* shareable experiment links
* public experiment gallery
* train/test split controls
* confusion matrix
* additional optimizers
* batch size control
* regularization controls
* dropout visualization
* activation distribution charts
* better mobile layout
* downloadable experiment reports
* collaborative experiment sharing

---

## Resume Description

Built Axon Studio, a browser-based ML visualization lab using Next.js, TypeScript, TensorFlow.js, and custom canvas visualizations. The platform allows users to train small neural networks directly in the browser, visualize decision boundaries, inspect misclassifications, import custom CSV datasets, compare saved experiments, track train/test accuracy, analyze gradient flow, scrub through epoch snapshots, and export experiment results as JSON or PNG. The project focuses on making neural-network training interpretable through interactive process-level visualizations rather than only showing final model output.

---

## Author

**Ayush Kar**

GitHub: [AyushKar2005](https://github.com/AyushKar2005)

---

## License

This project is currently open for learning, experimentation, and portfolio demonstration.

Add a license file later if you want to formally open-source it.
