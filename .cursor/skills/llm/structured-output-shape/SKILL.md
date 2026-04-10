# Structured Output Shape

## Purpose
Define an LLM output that downstream code can consume safely.

## Inputs
- consumer code needs
- failure cases
- optional fields and variants

## Process
1. define the minimum required fields
2. constrain variants explicitly
3. make optionality intentional
4. align with validation and parser strategy

## Outputs
- output schema
- parsing notes
- fallback behavior
