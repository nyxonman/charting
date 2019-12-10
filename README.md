# charting

```plantUML
@startuml
skinparam sequenceMessageAlign center
skinparam BoxPadding 50
title RECEIVER - PADA Sequence Diagram (Happy Path)

box "SENDER"
participant "Sender" as DLL1
end box

box "RECEIVER"
participant "DLLTX_PHY" as DLL2
participant "FH" as FH2
participant "LMMGR" as LMMGR2
participant "LMFS" as LMFS2
participant "CL" as CL2
participant "LKM MacStore" as LKM2
@enduml
```
