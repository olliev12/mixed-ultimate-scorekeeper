# mixed-ultimate-scorekeeper

TODO: 
- more game settings
    - add caps
    - alert warnings when approaching caps
    - track timeouts
- lines
    - suggested line based on rotation
        - future feature to have different rotation types
- games
    - green/red for win/loss?
- "game over" state for complete games
    - when gameTo score is reached
    - when we save the game (early end)
- add some manual overrides (specifically O/D) for safety
- add support for subs 
- expand events functionality
    - view/edit events
        - editing score will affect next point's possession start
    - undo/redo functionality? 
        - undo last event should repopulate the line
        - probably don't need redo if editing events is allowed
    - timeout/halftime events
