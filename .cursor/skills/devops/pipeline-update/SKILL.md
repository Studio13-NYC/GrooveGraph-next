# Pipeline Update

## Purpose
Change CI/CD behavior without making delivery harder to understand or recover.

## Inputs
- current pipeline
- desired change
- reliability requirements

## Process
1. identify the smallest useful pipeline change
2. preserve reproducibility
3. add validation where risk increases
4. document the new behavior and rollback implication

## Outputs
- pipeline change plan
- validation notes
- rollback implications
