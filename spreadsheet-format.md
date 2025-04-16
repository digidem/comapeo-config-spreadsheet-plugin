# Spreadsheet Format Documentation for CoMapeo Category Generator:

1. Categories Structure:
•  Columns:
  a. English: Category name in English
  b. Icons: Google Drive URL for category icon
  c. Details: Comma-separated list of required fields (enclosed in quotes)

2. Details Structure:
•  Columns:
  a. Label: Field identifier matching references in Categories
  b. Helper Text: User guidance question for the field
  c. Type: Field type ("text", "multiple", or empty for single choice)
  d. Options: Available choices for multiple/single choice fields

Data Rules:
1. Categories:
•  Each category must have a unique English name
•  Icon URLs must be valid Google Drive links
•  Details must reference existing fields from Details
•  Details lists must be enclosed in quotes when containing commas
2. Details:
•  Labels must be unique and match references in Categories
•  Helper Text should be phrased as a question
•  Type column:
•  "text" for free-form input
•  "multiple" for multi-select options
•  empty for single-select options
•  Options column:
•  Required for "multiple" type or single-select fields
•  Must be comma-separated list
•  Should be enclosed in quotes when containing multiple values

Example Records:
1. Categories:
English,Icons,Details
Oil extraction,https://drive.google.com/file/.../view,"Company, Status of extraction, Equipment in use"
2. Details:
Label,Helper Text,Type,Options
Company,What is the company name?,text,
Equipment in use,What equipment is used?,multiple,"Drilling rig, Chainsaw, Pump"
