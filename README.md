# mixed-ultimate-scorekeeper

Next Steps:
- convert all functionality to using the events tracked
    - no need to have in localStorage scoreLines, scoreEvents, lineOCount, etc
    - all that can be derived from the events array
- stats
    - points played based on ratio & possession
    - points scored based on ratio & possession
- Edit game 
    - load & don't pop, or
    - load, pop, save & re-insert in original position

TODO: 
- players
    - manage team, add players
    - choose players for every line
    - track play time
    - enforce ratio
- more game settings
    - add caps
    - alert warnings when approaching caps
    - start game button
    - disallow editing settings after game start (or when editing a saved game)
        - handle suggested alternative (saving current and starting a new game)
- lines
    - choose line popup
    - suggested line based on rotation
        - future feature to have different rotation types
        - for now, an even rotation should be default
- events
    - horizontal aligned boxes
    - bg color fill based on who scored (green for us and red for them)
- games
    - green/red for win/loss?