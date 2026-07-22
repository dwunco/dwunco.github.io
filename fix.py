string = """node add-level.mjs “Boxing Boxes” "classic" 106 94890873 “Boxing_Boxes” “Ellisha” "Ellisha" “fractal” "https://youtu.be/ilWAkVEghLY" 100 “Free “Copy “2.1, Long, Learny, Gimmicky, Memory,” “bronze”"""
newstring = string.replace("“", '"').replace("”", '"')
print(newstring)