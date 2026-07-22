string = """node add-level.mjs “how to Spiderr” "platformer" 14 122370463 “how_to_Spiderr” “TheGoloro” "TheGoloro" “aThingToEx” "https://youtu.be/8Ju3e7iB_SQ” 100 “Free Copy” "" “beginner”"""
newstring = string.replace("“", '"').replace("”", '"')
print(newstring)