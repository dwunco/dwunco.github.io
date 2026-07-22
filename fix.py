string = """node add-level.mjs “72" "platformer" 3 112603907 “72” “Polarbeahr” "Polarbeahr" “cookiedarookie” "https://youtu.be/LiT1SygzBXc" 100 “Free Copy” "" “silver”"""
newstring = string.replace("“", '"').replace("”", '"')
print(newstring)