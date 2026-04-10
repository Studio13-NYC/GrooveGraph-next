# Context Packet

## Purpose
Assemble only the context the model needs to perform reliably.

## Inputs
- user goal
- retrieved facts
- system constraints
- output requirements

## Process
1. include only relevant context
2. separate facts from instructions
3. make provenance or confidence explicit where useful
4. remove duplicate or conflicting context
5. keep the packet compact

## Outputs
- context structure
- included facts and instructions
- truncation or omission notes
