# Dataset Naming Convention

Use these filename prefixes so admin "Train Model" picks up new files automatically.

- Wait-time model: `wait_time_no_show_dataset_*.csv`
- No-show model (occurrence style): `no_show_occurrence_dataset_*.csv`
- Bed model: `bed_capacity_dataset_*.csv`
- Price model (hospital pricing): `price_hospital_dataset_*.csv`
- Price model (inpatient charges): `price_inpatient_dataset_*.csv`
- Disease model: `disease_symptom_profile_dataset_*.csv`

Examples:
- `wait_time_no_show_dataset_02.csv`
- `no_show_occurrence_dataset_03.csv`
- `bed_capacity_dataset_03.csv`
- `price_hospital_dataset_02.csv`
- `price_inpatient_dataset_02.csv`
- `disease_symptom_profile_dataset_02.csv`

How to add a new dataset:
1. Copy your CSV into this folder.
2. Rename it using the right prefix above.
3. Click Train in Admin panel (or call the respective train API).
4. The trainer automatically merges all files matching that prefix.
