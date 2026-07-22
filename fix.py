string = """node add-level.mjs “Lonely travel” "classic" 83 17924880 “Lonely_travel” “FunnyGame” "FunnyGame" “fractal” "https://youtu.be/null" 100 "248349" “2.0, XXL+, Nerve Control, Slow-Paced, Chokepoints, UFO” “bronze”"""
newstring = string.replace("“", '"').replace("”", '"')
print(newstring)