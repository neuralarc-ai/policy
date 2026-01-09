# Document Comparison Tool - Next.js Implementation

A sophisticated Next.js application for comparing insurance policy documents with advanced semantic matching, interactive editing, and comprehensive reporting capabilities.

## Features

### Core Functionality
- **Document Upload**: Drag-and-drop JSON file upload with validation
- **Semantic Matching**: Intelligent field comparison using insurance-specific synonyms and fuzzy matching
- **Interactive Editing**: Click-to-edit functionality for all field values
- **Real-time Analysis**: Live statistics and comparison status updates

### Advanced Comparison
- **Smart Table Row Matching**: Context-aware matching of tabular data
- **Date Recognition**: Flexible date parsing and normalization  
- **Coverage Analysis**: Automatic detection of coverage changes and impact assessment
- **Critical Mismatch Detection**: Prioritized display of important field differences

### Visualization & Reporting
- **Interactive Charts**: Pie charts showing comparison statistics and field distribution
- **Critical Alerts**: Highlighted critical mismatches requiring attention
- **Coverage Impact Analysis**: Visual representation of coverage changes
- **Professional Reports**: Downloadable HTML difference letters

### User Experience
- **Modern UI**: Clean, professional interface built with Tailwind CSS
- **Responsive Design**: Mobile-friendly layout that works on all devices
- **Loading States**: Smooth animations and progress indicators
- **Error Handling**: Comprehensive error management and user feedback

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for modern, responsive design
- **State Management**: Zustand for lightweight state management
- **Charts**: Chart.js for interactive data visualization
- **Icons**: Lucide React for consistent iconography

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd document-comparison
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

### Sample Data

The project includes sample JSON files for testing:
- `sample-data1.json` - Original policy document
- `sample-data2.json` - Updated/renewal policy document

These files demonstrate the expected JSON structure and include various field types including headers and tabular data.

## Usage

### Step 1: Upload Documents
1. Drag and drop or click to upload two JSON files containing insurance policy data
2. The application will display package information once files are loaded
3. Wait for the selection interface to appear

### Step 2: Select Documents
1. Choose a document from each package using the dropdown menus
2. Click "Compare Documents" to begin the analysis

### Step 3: Review Results
1. **Critical Mismatches**: Review highlighted critical differences at the top
2. **Dashboard**: Examine statistics, charts, and coverage analysis
3. **Detailed Comparison**: Browse field-by-field comparisons with editing capability
4. **Export Options**: Generate difference letters or export raw comparison data

### Step 4: Interact and Edit
- Click any field value to edit it in place
- Changes are tracked in the edit history
- Updated values immediately affect statistics and comparisons

## JSON Data Structure

The application expects JSON files with the following structure:

```json
{
  "batch": [
    {
      "packageID": "string",
      "packageName": "string", 
      "totalFiles": number,
      "packageStatus": "string",
      "fileNameList": [
        {
          "fileName": "string",
          "fieldList": [
            {
              "fieldname": "string",
              "rowid": "string",
              "columnname": "string",
              "extracteddata": "string",
              "confidencescore": number,
              "confidenceflag": "string"
            }
          ]
        }
      ]
    }
  ]
}
```

### Field Types
- **Header Fields**: Single-row fields (rowid = "1") with empty columnname
- **Table Fields**: Multi-row fields with same fieldname but different rowid values

## Key Features Explained

### Semantic Matching
The application uses intelligent semantic matching that goes beyond simple text comparison:

- **Insurance Terminology**: Built-in synonyms for insurance terms (e.g., "GL" = "General Liability")
- **Date Normalization**: Handles multiple date formats and normalizes for comparison
- **Fuzzy Matching**: Uses Levenshtein distance for similar but not identical values
- **Context Awareness**: Considers field importance and type in matching decisions

### Interactive Editing
All field values are editable with real-time updates:

- Click any value to edit in place
- Changes immediately update comparisons and statistics
- Edit history is maintained for audit purposes
- Keyboard shortcuts (Enter to save, Escape to cancel)

### Coverage Analysis
Specialized analysis for insurance coverage changes:

- **Numerical Changes**: Percentage calculations for limit increases/decreases
- **Qualitative Analysis**: Keyword-based detection of coverage enhancements or restrictions  
- **Impact Assessment**: Clear indication of positive or negative coverage changes
- **Critical Field Priority**: Important insurance fields are flagged for special attention

### Export Capabilities
Multiple export options for different use cases:

- **Difference Letters**: Professional HTML reports suitable for client communication
- **Raw Data Export**: JSON format containing all comparison data and edit history
- **Print-Friendly**: Clean formatting optimized for printing or PDF generation

## Development

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                # Utility functions and business logic
├── store/              # Zustand state management
└── types/              # TypeScript type definitions
```

### Key Components
- `UploadSection`: File upload and validation
- `SelectionSection`: Document selection interface
- `Dashboard`: Statistics, charts, and critical alerts
- `ComparisonResults`: Detailed field-by-field comparison
- `HeaderComparison`: Side-by-side header field comparison
- `TableComparisons`: Intelligent table row matching and display

### Build for Production
```bash
npm run build
npm start
```

### Linting and Type Checking
```bash
npm run lint
npx tsc --noEmit
```

## Performance Optimizations

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component for optimized loading
- **Memoization**: React.memo and useMemo for expensive calculations
- **Lazy Loading**: Components loaded only when needed
- **Bundle Analysis**: webpack-bundle-analyzer for optimization insights

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the coding standards
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please refer to the documentation or create an issue in the project repository.