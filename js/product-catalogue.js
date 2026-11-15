(function attachProductCatalogue(root) {
  const patternFromRows = (rows) => rows.flatMap((row, y) => (
    Array.from(row).flatMap((c, x) => c === "." ? [] : [{ x: x + 1, y: y + 1, c: c.toLowerCase() }])
  ));

  // Owner-approved single-butterfly construction: looped upper and lower
  // wings around a narrow pearl body, with two corded antennae.
  const ownerApprovedButterflyRows = [
    ".....d.....d.....",
    "......d...d......",
    ".......ccc.......",
    "..aaaa.ccc.aaaa..",
    ".aaaaa.ccc.aaaaa.",
    ".aa..a.ccc.a..aa.",
    ".aaaaa.ccc.aaaaa.",
    "..aaaa.ccc.aaaa..",
    "...bbb.ccc.bbb...",
    "..bbbbbcccbbbbb..",
    "..bbbbbcccbbbbb..",
    "...bbb.ccc.bbb...",
    ".......ccc.......",
    "........c........"
  ];
  const ownerApprovedButterflyNameRows = ownerApprovedButterflyRows.map((row, index) => (
    `${row}${[3, 4, 5, 6, 7, 8].includes(index) ? ["....n.", ".....n", ".....n", "....n.", "...n..", "..n..."][index - 3] : "......"}`
  ));
  const ownerApprovedButterflyFlowerRows = ownerApprovedButterflyRows.map((row, index) => (
    `${row}${[
      "........", "........", "........", "........", "........", "....eee.",
      "...eefee", "....eee.", ".....g..", "....ggg.", ".....g..", "....ggg.",
      ".....g..", "........"
    ][index]}`
  ));

  const previewPatterns = {
    butterfly: patternFromRows(ownerApprovedButterflyRows),
    fish: patternFromRows([
      "...aaa.....",
      ".aaaaaa..c",
      "aaaaaaa.cc",
      ".aaaaaa..c",
      "...aaa....."
    ]),
    crab: patternFromRows([
      "a..a...a..a",
      ".aa.aaa.aa.",
      "...aaaaa...",
      "..aaaaaaa..",
      "...aaaaa...",
      ".aa.....aa.",
      "a.........a"
    ]),
    penguin: patternFromRows([
      "..aaaaa..",
      ".aaaaaaa.",
      "aabbabbaa",
      "ababbbaba",
      "abbbccbba",
      "abbbcbbba",
      "aabbbbbaa",
      "aabbbbbaa",
      "aabbbbbaa",
      "aaabbbaaa",
      "aabbbbbaa",
      ".ccaaacc."
    ]),
    gecko: patternFromRows([
      ".......aaa.......",
      "......acaca......",
      "......aaaaa......",
      ".......aaa.......",
      "...cc..bbb..cc...",
      "..ccc.ababa.ccc..",
      "......ababa......",
      "...cc.abbbba.cc..",
      "..ccc.abbbba.ccc.",
      "......ababa......",
      ".......aaa.......",
      ".......aaa.......",
      ".......aaa.......",
      ".......aaa.......",
      "........aa.......",
      "........a........",
      ".......a........."
    ]),
    frog: patternFromRows([
      ".....aba.....",
      "....acaca....",
      "...aaaaaaa...",
      "cc.aaabaaa.cc",
      ".c.aaaaaaa.c.",
      "...aabaaaa...",
      "...aaaaaaa...",
      "..baaaaaaab..",
      ".bb.aaaaa.bb.",
      "cc.........cc"
    ]),
    flower: patternFromRows([
      "...c...",
      "..aca..",
      ".aacaa.",
      "..aca..",
      "...b...",
      "..aaa..",
      ".aabaa.",
      "..aaa..",
      "...b...",
      "..aaa..",
      ".aabaa.",
      "..aaa..",
      "...b..."
    ]),
    bigFlower: patternFromRows([
      "........b........",
      "......aabaa......",
      ".....aaabbba.....",
      "...aaaabbbaaaa...",
      "..aaaabbbbbaaaa..",
      ".aaaabbbbbbbaaaa.",
      "..aaaabbbbbaaaa..",
      "...aaaabbbaaaa...",
      ".....aaabbba.....",
      ".......ccc.......",
      ".......ccc.......",
      "....cccccc.......",
      "...ccccccc.......",
      ".......cccccc....",
      ".......ccccccc...",
      ".......ccc.......",
      ".......ccc......."
    ]),
    butterflyWithFlowers: patternFromRows(ownerApprovedButterflyFlowerRows),
    macaw: patternFromRows([
      "...aaaa....",
      "..aaaaac...",
      ".aaabbcc...",
      ".aaaacc....",
      ".aaaaa.....",
      ".aaaaa.....",
      ".aaabbbb...",
      ".aaabbbb...",
      ".aaabbbb...",
      "..dddd.....",
      "..dddd.....",
      "..dddd.....",
      "..dddd.....",
      "...ddd.....",
      "...ddd.....",
      "....dd.....",
      "....d......"
    ]),
    cross: patternFromRows([
      "....aaa....",
      "...ababa...",
      "...ababa...",
      "...ababa...",
      "aaaabaaaaaa",
      "aaabbbbbaaa",
      "aaaabaaaaaa",
      "...ababa...",
      "...ababa...",
      "...ababa...",
      "...ababa...",
      "...ababa...",
      "...ababa...",
      "...ababa...",
      "....aaa...."
    ]),
    pencil: patternFromRows([
      "..ccc..",
      ".ccccc.",
      ".aaaaa.",
      ".aabaa.",
      ".aabaa.",
      ".aabaa.",
      ".aaaaa.",
      ".ccccc.",
      ".aaaaa.",
      ".aaaaa.",
      ".aaaaa.",
      "..aaa..",
      "..aaa..",
      "...a..."
    ]),
    octopus: patternFromRows([
      "....aaaaa....",
      "...aaaaaaa...",
      "..aaabaaa...",
      ".aaaaaaaac..",
      ".aaaaaaaaa..",
      "..aaaaaaa...",
      "...aaaaa....",
      ".aa.aa.aa.aa",
      "aa..aa..aa..",
      "a...a...a..."
    ]),
    turtle: patternFromRows([
      "....aaa....",
      "...aaaaa...",
      "..abbbbba..",
      ".abbbbbba.c",
      "abbbbbbbbac",
      ".abbbbbba.c",
      "..abbbbba..",
      "...aaaaa...",
      "..a.....a..",
      ".a.......a."
    ]),
    whale: patternFromRows([
      "....aaaaaa...",
      "..aaaaaaaaaa.",
      ".aaaaaaaaaaac",
      "aaaaaaaaaaacc",
      ".aaaaaaaaaaa.",
      "..aaaaaaa....",
      "....aa..aa..."
    ]),
    jellyfish: patternFromRows([
      "..aaaaa..",
      ".aaaaaaa.",
      "aaaaaaaaa",
      "abbbbbbba",
      ".a.a.a.a.",
      ".a.a.a.a.",
      "a..a.a..a",
      "a..a.a..a"
    ]),
    lobster: patternFromRows([
      "a.......a",
      ".a.....a.",
      "..a...a..",
      "...bbb...",
      "..bbbbb..",
      ".bbbbbbb.",
      "..b.b.b..",
      ".b..b..b.",
      "b...b...b"
    ]),
    shark: patternFromRows([
      ".....a....",
      "....aa....",
      "..aaaaa...",
      ".aaaaaaac.",
      "aaaaaaaaaa",
      ".aaaaaa...",
      "..aa.aa..."
    ]),
    soccerBall: patternFromRows([
      "...aaaaa...",
      "..aabbaa..",
      ".aabbaabba.",
      "aaabbabbbaa",
      "aabbbbbbbaa",
      "aaabbabbbaa",
      ".aabbaabba.",
      "..aabbaa..",
      "...aaaaa..."
    ]),

    mushroom: patternFromRows([
      "...aaa...",
      "..aaaaa..",
      ".aaaaaaa.",
      "aaaabbbaa",
      "..bbbbb..",
      "..bbbbb..",
      "..bbbbb..",
      ".bbbbbbb."
    ]),
    iceCream: patternFromRows([
      "...aaa...",
      "..aaaaa..",
      ".aaaaaaa.",
      ".aaaaaaa.",
      "..aaaaa..",
      "...bbb...",
      "..bbbbb..",
      "...bbb...",
      "....b...."
    ]),
    babyGecko: patternFromRows([
      "....aaa....",
      "...ababa...",
      "....aaa....",
      ".cc..bbb..cc",
      "..c.ababa.c.",
      "....ababa...",
      ".cc.abbbba.cc",
      "..c..aba..c.",
      ".....aaa....",
      ".....aaa....",
      "......aa....",
      ".......a...."
    ]),
    ladybug: patternFromRows([
      "...bbbbb...",
      "..bcccccb..",
      ".baacccaab.",
      ".baaacaaab.",
      ".baacccaab.",
      ".baaacaaab.",
      "..baaaaab..",
      "...bbbbb...",
      "....bbb....",
      ".....b....."
    ]),
    dragonfly: patternFromRows([
      ".......b.......",
      "......bbb......",
      "..aaa..b..aaa..",
      ".aaaaa.b.aaaaa.",
      "..aaaa.b.aaaa..",
      "....aa.b.aa....",
      "......bbb......",
      ".......b.......",
      ".......b.......",
      ".......b.......",
      ".......b......."
    ]),
    basketball: patternFromRows([
      "...aaaaa...",
      "..aabaaaa..",
      ".aaabaaaaa.",
      "aaabaaaaaaa",
      "bbbbbbbbbbb",
      "aaabaaaaaaa",
      ".aaabaaaaa.",
      "..aabaaaa..",
      "...aaaaa..."
    ]),
    baseball: patternFromRows([
      "...aaaaa...",
      "..aabaaaa..",
      ".aaabaaaaa.",
      "aaaabaaaaaa",
      "aaaaabaaaaa",
      "aaaaaabaaaa",
      ".aaaaabaaa.",
      "..aaaabaa..",
      "...aaaaa..."
    ]),
    bracelet: patternFromRows([
      "....aaaaaaaa....",
      "..aa........aa..",
      ".a............a.",
      "a..............a",
      ".a............a.",
      "..aa........aa..",
      "....aaaaaaaa...."
    ]),
    flowerLanyard: patternFromRows([
      "aa...........aa",
      "aba.........aba",
      "aca.........aca",
      "ada.........ada",
      "aea.........aea",
      ".aba.......aba.",
      ".aca.......aca.",
      "..ada.....ada..",
      "...aea...aea...",
      "....aba.aba....",
      ".....acaca.....",
      "......ada......"
    ]),
    loveHeart: patternFromRows([
      ".aaa...aaa.",
      "aaaaa.aaaaa",
      "aaaaaaaaaaa",
      "aaaaaaaaaaa",
      ".aaaaaaaaa.",
      "..aaaaaaa..",
      "...aaaaa...",
      "....aaa....",
      ".....a....."
    ]),
    apple: patternFromRows([
      "....c.bb..",
      "....cbbbb.",
      "....c.bbb.",
      ".aaaaaaa..",
      "aaaaaaaaa.",
      "aaaaaaada.",
      "aannnnaaa.",
      "aaaaaaaaa.",
      ".aaaaaaa..",
      "..aaaaaa.."
    ]),
    unicorn: patternFromRows([
      ".........c...",
      "........cc...",
      "...aaa.cc....",
      "..abaaa......",
      ".abbbaaa.....",
      "aabaaaaa.....",
      ".aaaaaaa.....",
      "..aaaaa......",
      "...aaa.......",
      "...a.a.......",
      "..a...a......",
      ".a.....a....."
    ]),
    monkey: patternFromRows([
      "..aa...aa..",
      ".abaaaaaba.",
      "abbbbbbbba",
      "abcbcbcba",
      ".abbbbba..",
      "..abbba...",
      "...aaa....",
      "..a.a.a...",
      ".a..a..a..",
      "a...a...a."
    ]),
    lion: patternFromRows([
      "..ccccccc..",
      ".ccaaaaacc.",
      "ccaaabaaaac",
      "caaababaac.",
      "caaaadaaac.",
      ".caaaaaaac.",
      "..caaaaac..",
      "...bbbbb...",
      "..bbbbb....",
      ".bbb.bbb...",
      "bbb...bbb..",
      "bb.....bb.."
    ]),
    zebra: patternFromRows([
      "....bbb....",
      "...babbb...",
      "...bbabb...",
      "....bbb....",
      "....aba....",
      "....aba....",
      "..bbabaaabb",
      ".bbaaaabbb.",
      "...ababa...",
      "...ababa...",
      "..ab...ba..",
      ".ab.....ba."
    ]),
    panda: patternFromRows([
      "..bb...bb..",
      ".bbaaaaabb.",
      "bbaaaaaaabb",
      "baabbaaaabb",
      "baaacacaaab",
      "baaabbbaaab",
      ".baaaaaaab.",
      "..baaaaab..",
      "...bbbb...."
    ]),
    rocket: patternFromRows([
      "....a....",
      "...aaa...",
      "..aabaa..",
      ".aabbbaa.",
      ".aabbbaa.",
      ".aabbbaa.",
      ".aabbbaa.",
      ".aabbbaa.",
      ".aaaaaaa.",
      "aaacccaaa",
      "a..ccc..a",
      "...cdc...",
      "...ddd...",
      "....d...."
    ]),
    canadaFlag: patternFromRows([
      "aaaaaaaaaaaaaaa",
      "aaabbbbbbbbbaaa",
      "aaabbcccccbbbaa",
      "aaabcccccccbbaa",
      "aaabbcccccbbbaa",
      "aaabbbbbbbbbaaa",
      "aaaaaaaaaaaaaaa"
    ]),
    giraffe: patternFromRows([
      "..a.a......",
      "..aaa......",
      ".ababa.....",
      "..aaa......",
      "..aba......",
      "..aba......",
      "..aba......",
      "..abaaaaa..",
      "..abababaa.",
      "..aaaaaaa..",
      "..a..a.....",
      "..a..a.....",
      ".a...a.....",
      ".a...a....."
    ]),
    mermaid: patternFromRows([
      ".....aaa.....",
      "....ababa....",
      ".....aaa.....",
      "...ccbbbcc...",
      "..cccbbbccc..",
      ".....bbb.....",
      ".....bbb.....",
      "....bbbbb....",
      "...bbbbbbb...",
      "....bbbbb....",
      ".....bbb.....",
      "....bbbbb....",
      "...bb...bb...",
      "..bb.....bb.."
    ]),
    palmTree: patternFromRows([
      "....aaa.aaa....",
      "..aaaaaaaaaaa..",
      ".aaaaaabaaaaaa.",
      "...aaa.b.aaa...",
      "......bbb......",
      ".......b.......",
      ".......b.......",
      "......bbb......",
      "......bbb......",
      ".....bbbbb.....",
      ".....bbbbb....."
    ]),
    pumpkinLatte: patternFromRows([
      "....ccccc....",
      "...ccccccc...",
      "..bbbbbbbbb..",
      ".baaaaaaaaab.",
      ".baaaaaaaaab.",
      ".baaacaaaab.",
      ".baaacaaaab.",
      ".baaaaaaaaab.",
      "..baaaaaab..",
      "...bbbbbbb...",
      "....ddddd...."
    ]),
    stripeKeychain: patternFromRows([
      "..aaaaa..",
      "..bbbbb..",
      "..ccccc..",
      "..aaaaa..",
      "..bbbbb..",
      "..ccccc..",
      "..aaaaa..",
      "..bbbbb..",
      "..ccccc..",
      "..aaaaa..",
      "..bbbbb..",
      "..ccccc.."
    ]),
    meltingIceCream: patternFromRows([
      "...aaaaa...",
      "..aaaaaaa..",
      ".aaaaaaaaa.",
      ".aaabaaabaa.",
      "..aaaaaaa..",
      "...aaaaa...",
      "....bbb....",
      "...bbbbb...",
      "...bbbbb...",
      "....bbb....",
      "....bbb....",
      ".....b....."
    ]),
    puppy: patternFromRows([
      ".aa.......aa.",
      "aaaa.....aaaa",
      ".aaaaaaaaaaa.",
      "..aabbbbbaa..",
      "..abacacaba..",
      "..abbbbbbba..",
      "...abcccba...",
      "....abbba....",
      ".....aaa.....",
      "....a...a....",
      "...a.....a..."
    ]),
    autumnTree: patternFromRows([
      "....a....",
      "..aacaa..",
      ".aaacaaa.",
      "aaaacaaaa",
      ".aaacaaa.",
      "..bbbbb..",
      "....b....",
      "....b....",
      "...bbb..."
    ]),
    cinnamonRoll: patternFromRows([
      "..aaaaa..",
      ".aabbbba.",
      "aabbabbaa",
      "aabbbbaaa",
      "aabbaaaaa",
      ".aaaaaaa.",
      "..aaaaa.."
    ]),
    pieSlice: patternFromRows([
      "......c..",
      ".....ccc.",
      "....cccaa",
      "...aaaaaa",
      "..aaaaaaa",
      ".bbbbbbbb",
      "bbbbbbbbb"
    ]),
    cozySweater: patternFromRows([
      "..aa...aa..",
      ".aaa...aaa.",
      "aaaaaaaaaaa",
      "aaabbbbbaaa",
      "..abcbcbba.",
      "..abbcbaba.",
      "..abcbcbba.",
      "..aaaaaaaa.",
      "..aaaaaaaa."
    ]),
    hotChocolate: patternFromRows([
      "....ccc....",
      "...ccccc...",
      "..bbbbbbb..",
      ".baaaaaaab.",
      ".baaaaaaabb",
      ".baaabbaa.b",
      ".baaabbaa..",
      "..baaaaab..",
      "...bbbbb..."
    ]),
    pinecone: patternFromRows([
      "...ccc...",
      "..ccccc..",
      "...bbb...",
      "..babab..",
      ".bababab.",
      "babababab",
      ".bababab.",
      "..babab..",
      "...bbb...",
      "....b...."
    ]),
    acorn: patternFromRows([
      "....b....",
      "....b....",
      "..bbbbb..",
      ".bbbbbbb.",
      "..aaaaa..",
      ".aaaaaaa.",
      ".aaaaaaa.",
      "..aaaaa..",
      "...aaa...",
      "....a...."
    ]),
    scarf: patternFromRows([
      "...aaaa...",
      "..abbbba..",
      ".abccccba.",
      "..abbbba..",
      "...aaaa...",
      "...ab.....",
      "..ab......",
      ".ab.......",
      ".ab.......",
      "..b......."
    ]),
    umbrella: patternFromRows([
      "....a....",
      "..aaaaa..",
      ".aabbaaab.",
      "aaaaaaaaa",
      ".a.a.a.a.",
      "....c....",
      "....c....",
      "....c....",
      "....cc...",
      ".....c..."
    ]),
    squirrel: patternFromRows([
      "..aa......",
      ".aaaa..bbb.",
      ".acaa.bbbbb",
      "..aaaabbbb.",
      "...aaaaaa..",
      "..aaaaaaa..",
      ".aa.aaa.aa.",
      "aa..aaa..aa",
      "....aaa...."
    ]),
    dove: patternFromRows([
      "........aa.........",
      ".......aaaa........",
      "......aabbaa...e...",
      "..aaaaaabbaa..ddd..",
      "aaaaaaaaaaaa.ddddd.",
      ".aaaaaaaaaa...ddd..",
      "...aaaaaaaa....d...",
      ".....aaaaaa.........",
      "......aaaa..........",
      ".......aa..........."
    ]),
    tiger: patternFromRows([
      "..aaa.aaa..",
      ".aaba.abaa.",
      "aabbaabbaaa",
      "aacbabcacaa",
      ".aaccccaa..",
      "..aabbaa...",
      ".aaabaaaaa.",
      "aabaaaaabaa",
      "ab..aaa..ba"
    ]),
    rainBoots: patternFromRows([
      ".aa..aa.",
      ".aa..aa.",
      ".bb..bb.",
      ".aa..aa.",
      ".aa..aa.",
      ".aa..aa.",
      ".aa..aa.",
      "aaa..aaa",
      "aaaa.aaaa"
    ]),
    volleyball: patternFromRows([
      "...aaaaa...",
      "..aabbbba..",
      ".aabbbaaaaa.",
      "aabbbaaaaaa",
      "abbbaaaaaaa",
      "aaaaacccaaa",
      ".aaaacccaa.",
      "..aaaccca..",
      "...aaaaa..."
    ]),
    car: patternFromRows([
      ".....aaaaa.....",
      "...aaaaaaaaa...",
      "..aabbbbbbaaa..",
      ".aaaaaaaaaaaaa.",
      "aaaaaaaaaaaaaaa",
      "aaabbbaaaabbbaa",
      "..bbb.....bbb.."
    ]),
    rainbowName: patternFromRows([
      "aaabbbcccdddeee",
      "aaabbbcccdddeee",
      "....aaaaaaaaaaa",
      "...aaaaaaaaaaaa",
      "..aaa.......aaa",
      ".aaa.........aaa"
    ]),
    flowerBar: patternFromRows([
      "..aaa.....aaa..",
      ".aabaa...aabaa.",
      "..aaa.....aaa..",
      "...c.......c...",
      "..aaa.....aaa..",
      ".aabaa...aabaa.",
      "..aaa.....aaa.."
    ])
  };

  // These visual reconstructions are intentionally proposals, not manufacturing
  // patterns. They model the visible front-facing bead layout from approved
  // catalogue assets while hidden cord paths and reverse-side construction await
  // owner verification.
  const provisionalPatternRows = {
    "best-friends-forever-bracelet": [
      "....aaaaaaa....", "..aa.......aa..", ".a...........a.", "a.............a",
      "a.............a", ".a...........a.", "..annnnnnnnnaa..", "....aabbaa...."
    ],
    "unicorn-dreams-bracelet": [
      "....aaaaaaa....", "..ab.......ba..", ".a...........a.", "a.............a",
      "a.............a", ".a...........a.", "..annnnnnnnnaa..", "....aabbaa...."
    ],
    "mermaid-wishes-bracelet": [
      "....aaaaaaa....", "..ac.......ca..", ".a...........a.", "a.............a",
      "a.............a", ".a...........a.", "..annnnnnnnnaa..", "....aabbaa...."
    ],
    "sweetheart-bracelet": [
      "....abcbaaa....", "..aa.......aa..", ".a...........a.", "a.............a",
      "a.............a", ".a...........a.", "..annnnbnnnnaa..", "....aacaa...."
    ],
    "pearl-glow-bracelet": [
      "....aaaaaaa....", "..ab.......ba..", ".a...........a.", "a.............a",
      "a.............a", ".a...........a.", "..annnnbnnnaa..", "....aaaaa...."
    ],
    "personalized-butterfly-keychain": ownerApprovedButterflyNameRows,
    "personalized-blossom-keychain": [
      "....aaa....", "..aaabaaa..", ".aaabbbaaa.", "aaabbbbbaaa", ".aaabbbaaa.",
      "..aaabaaa..", "....ccc....", "....cdc....", "....ccc....", "....cec....",
      "....ccc....", "...d...d...", "..d.....d.."
    ],
    "butterfly-with-flowers": [
      "..aaa.......aaa..", ".aadaa.....aadaa.", "aaaaaa..b.aaaaaa", ".aadaa.bbb.aadaa.",
      "..aaa..bbb..aaa..", "....aa.bbb.aa....", "..ccc..bbb..ccc..", ".cecec.bbb.cecec.",
      "..ccc..bbb..ccc..", ".......bbb.......", "........b........"
    ],
    "personalized-turtle-keychain": [
      ".....aaa.....", "...aabbaa....", "..aabbbbaa...", ".aabbbbbbaa..", "aabbbbbbbbaa.",
      ".aabbbbbbaa..", "..aabbbbaa...", "c...aaaa...c.", "....dddd.....", "....deded....",
      "....dddd.....", "....dfdf.....", "....dddd....."
    ],
    "personalized-scripture-dove-keychain": [
      ".........aa......", "........aaaa.....", "...aaaaaabbaa....", ".aaaaaaaaaaaa.ccc.",
      "aaaaaaaaaaaaacccc", ".aaaaaaaaaaa..ccc.", "...aaaaaaaa...c..", ".....aaaaaa......",
      "......aaaa.......", ".......dd........", ".......ded.......", ".......ddd......."
    ],
    "butterfly-collection": ownerApprovedButterflyRows,
    "butterfly-name-keychain": ownerApprovedButterflyNameRows,
    "flower-braided": [
      "....aaa....", "..aabbbaa..", ".aabbbbbaa.", "..aabbbaa..", "....ccc....",
      "...cdcdc...", "....ccc....", "...cecec...", "....ccc....", "...cfcfc...", "....ccc...."
    ],
    "intricated-flower": [
      ".....aaa.....", "..aaabbbaaa..", ".aabbbbbbbbb..", "aabbbcccbbbaa", ".aabbbbbbbbaa.",
      "..aaabbbaaa..", ".....ddd.....", "...ddeddd....", "..dddedddd...", ".....ddd....."
    ],
    "butterfly-and-flower": ownerApprovedButterflyFlowerRows,
    "abc-blocks": [
      "aaabbbccc", "aaabbbccc", "adabeccfc", "aaabbbccc", "ggghhhiii", "gjghkhili", "ggghhhiii"
    ],
    "backpack": [
      "...aaaa...", "..abbbba..", ".aaaaaaaa.", ".acccccca.", ".acddddca.",
      ".acddddca.", ".acccccca.", ".aaaaaaaa.", "..aa..aa..", ".aa....aa."
    ],
    "school-bus": [
      "..aaaaaaaaa..", ".abbbbbbbbba.", "aabcbcbcbbaa", "aaaaaaaaaaaaa", "aadadaadadaaa", ".eeeeeeeeeee.", "..ff.....ff.."
    ],
    "ruler": [
      "aaaaaaaaaaaaaaa", "abacabadabacaba", "aaaaaaaaaaaaaaa"
    ],
    "calculator": [
      ".aaaaaaaa.", "abbbbbbbba", "abbbbbbbba", "acacacacca", "acacacacca", "acacacacca", ".aaaaaaaa."
    ],
    "glue-bottle": [
      "...aaa...", "..ababa..", "..aaaaa..", ".bbbbbbb.", ".bcccccb.",
      ".bcccccb.", ".bbbbbbb.", "..bbbbb.."
    ],
    "scissors": [
      "aa.......aa", "aaa.....aaa", ".aa.....aa.", "..aa...aa..", "...aa.aa...", "....aba....", "...bb.bb...", "..bb...bb.."
    ],
    "lunch-box": [
      "...aaaa...", "..a....a..", ".bbbbbbbb.", "bccccccccb", "bcddddddcb", "bccccccccb", ".bbbbbbbb."
    ],
    "stack-of-books": [
      ".aaaaaaaaaa.", "abbbbbbbbbba", ".cccccccccc.", "cddddddddddc", ".eeeeeeeeee.", "effffffffffe"
    ],
    "owl": [
      "aa.....aa", "aaa...aaa", ".aabbbaa.", "aabcbcbaa", "aabbbbbaa", ".aabbbbaa.", "..abdbba..", "...bbb..."
    ],
    "fall-fox": [
      "aa.......aa", "aaaa.....aaaa", ".aaabbbbbaaa.", "..abccccba..", "..abcddcba..",
      "...bccccb...", "....bccb....", "..bbb..bbb..", ".bb......bb."
    ],
    "fall-maple-leaf": [
      "......a......", "..a...aaa...a..", ".aaa.aaaaa.aaa.", "aaaaaaaaaaaaaaa", ".aaaaaaaaaaaaa.",
      "...aaaaaaaaa...", ".....aaaaa.....", "......bbb......", "......bbb......"
    ],
    "fall-sunflower": [
      "....aaa....", "..aabbbaa..", ".aabbbbbaa.", "aabbcccbbaa",
      ".aabbbbbaa.", "..aabbbaa..", "....ddd....", "...ddddd...", "....ddd...."
    ],
    "fall-leaves-keychain": [
      ".aaa.......bbb.", "aaaaa.....bbbbb", ".aaaaa...bbbbb.", "..aaa.....bbb..", "...c.......c...",
      "......ddd......", ".....ddddd.....", "......ddd......", ".......c......."
    ],
    "spider-man": [
      "...aaaaa...", "..abbbbba..", ".abcbcbcba.", ".abbbbbba.", "..abbbbba..",
      "...aaaaa...", "..aadddaa..", ".aaadddaaa.", "aa..ddd..aa", "....ddd....", "...dd.dd..."
    ],
    "spider-man-version-1": [
      "...aaaaa...", "..abbbbba..", ".abcbcbcba.", ".abbbbbba.", "..abbbbba..",
      "...aaaaa...", ".aaadddaaa.", "aaadddddaaa", "aa..ddd..aa", "....ddd....", "...dd.dd..."
    ],
    "christmas-star": [
      "......a......", ".....aaa.....", "a...aaaaa...a", ".aaaaaaaaaaa.", "..aaaaaaaaa..", "...aaaaaaa...",
      "..aaaaaaaaa..", ".aaaa...aaaa.", "aaaa.....aaaa"
    ],
    "poinsettia": [
      "....a...a....", "..aaaa.aaaa..", ".aaaaaaaaaaa.", "aaaabbbbbaaaa", ".aaabbcbbaaa.",
      "..aaabaaa...", ".ddd...ddd...", "ddddd.ddddd..", ".ddd...ddd..."
    ],
    "christmas-truck": [
      "......d.......", ".....ddd......", "....ddddd.....", "aaaaaaaaaaaaa.", "abbbbaaaaaaaa.",
      "abbbbaacccaaa.", "aaaaaaaaaaaaaa", "..eeee...eeee."
    ],
    "christmas-teddy-bear": [
      "..aa...aa..", ".aaaa.aaaa.", ".aaaaaaaaa.", ".aabcbcbba.", "..abbcbba..", "aaabbbbbaaa",
      ".aaadddaaa.", "...aaaaa...", "...aa.aa...", "..aa...aa.."
    ],
    "christmas-polar-bear": [
      "..aa...aa..", ".aaaaaaaaa.", ".aabbbbbaa.", ".abcacacba.", "..abccbba..", "aaabbbbbaaa",
      ".aaadddaaa.", "...aaaaa...", "...aa.aa...", "..aa...aa.."
    ],
    "gingerbread-girl": [
      "...aaaaa...", "..aabbaa...", ".aabcbcbaa.", "..aabbbaa..", "aaabbbbbaaa", ".aabdbdbaa.",
      "..aaeeaaa..", "..aa...aa..", ".aa.....aa."
    ],
    "christmas-wreath": [
      "...aaaaa...", ".aaaaaaaaa.", "aaa.....aaa", "aa.......aa", "aa.......aa", "aaa.....aaa",
      ".aaabbbbaa.", "..abbbbbba.", "...bbbbb..."
    ],
    "christmas-candy-cane": [
      "...aabb...", "..aabbaa..", ".aabbbaa..", ".abbbaa...", "..bbaa....", "..aabb....",
      "..bbaa....", ".aabbccaa.", "aabbccccaa", ".aa..cc..aa"
    ],
    "christmas-present": [
      "..bbb.bbb..", ".bbbbbbbbb.", "...bbbbb...", "aaaaaaaaaaa", "aaaabbbaaaa", "aaaabbbaaaa",
      "aaaabbbaaaa", "aaaabbbaaaa", "aaaabbbaaaa"
    ],
    "christmas-stocking": [
      "..bbbbbbb..", ".bbbbcbbbb.", "...aaaaa...", "...aaaaa...", "...aaaaa...", "...aaaaa...",
      "...aaaaa...", ".aaaaaaaa..", "aaaaaaaa...", ".aaaaaa...."
    ],
    "christmas-tree": [
      ".....d.....", "....aaa....", "...aaaaa...", "..aabaaaa..", ".aaaaacaaaa.", "aaaabaaaaaaa",
      "..aaaaaaa..", ".aaacaaaaaa.", "aaaaaaaaaaa", "....eee....", "....eee...."
    ],
    "christmas-snowflake": [
      "a.....a.....a", ".a....a....a.", "..a...a...a..", "...a..a..a...", "....aaaaa....",
      "aaaaaaaaaaaaa", "....aaaaa....", "...a..a..a...", "..a...a...a..", ".a....a....a.", "a.....a.....a"
    ],
    "gingerbread-man": [
      "...aaaaa...", "..aabbaa...", ".aabcbcbaa.", "..aabbbaa..", "aaabbbbbaaa", ".aabdbdbaa.",
      "..aabaaaa..", "..aa...aa..", ".aa.....aa."
    ],
    "christmas-angel": [
      "....ddd....", "...daaad...", "...abcba...", "..aabbbaa..", ".eeebbbeee.", "eeeeebbeeee",
      "...bbbbb...", "..bbbbbbb..", ".bbbbbbbbb."
    ],
    "christmas-snowman": [
      "..bbbbbbb..", "...bbbbb...", "...aaaaa...", "..aacacaa..", "...aadaa...", "...eeeee...",
      "..aaaaaaa..", ".aaaaaaaaa.", ".aaaafaaaa.", "..aaaaaaa.."
    ],
    "christmas-reindeer": [
      "aa.......aa", ".aa.....aa.", "..aa...aa..", "...bbbbb...", "..bbbbbbb..", ".bbcbdcbb.",
      "..bbebb...", "aaabbbbbaaa", "...bbbbb...", "...bb.bb..."
    ],
    "christmas-elf": [
      ".....a.....", "....aaa....", "...aaaaa...", "..aabbbbb..", ".bbbcbbcbb.", "..bbbbbbb..",
      "cccddeedccc", "...ddddd...", "...ddddd...", "..ff...ff.."
    ],
    "glow-in-the-dark-christmas-ornament": [
      ".....aa.....", "....aaaa....", "..bbbbbbbb..", ".bbccddccbb.", "bbcddeeddcbb", "bcdeeffeedcb",
      "bcdeeffeedcb", "bbcddeeddcbb", ".bbccddccbb.", "..bbbbbbbb.."
    ],
    "mrs-claus": [
      "....aaa....", "...aaaaa...", "..aabbbbaa..", ".bbbcbbcbbb.", "..bbbbbbb..", "cccaaddaccc",
      "...aaaaa...", "..aaeeeaa..", "..aa...aa..", "..ff...ff.."
    ],
    "christmas-santa": [
      "....aaa....", "...aaaaa...", "..aabbbbaa..", ".bbbcbbcbbb.", "..bbbbbbb..", "cccaaddaccc",
      "...aaaaa...", "..aaeeeaa..", "..aa...aa..", "..ff...ff.."
    ]
  };

  // Final owner-requested correction batch. These rows reproduce only the
  // front-facing construction visible in approved photographs. Hidden cord
  // paths remain unverified until the owner approves each corrected proposal.
  const ownerCorrectedPatternRows = {
    "tiger": [
      "..aa.......aa..", ".aaaa.....aaaa.", "..aabaaaaabaa..", "...abbbbbba...",
      "..aabcbcbbaa..", "...abdddba...", "....abeba....", ".....aaa.....",
      "aa..aabaa..aa", ".aa.aabaa.aa.", "..aaababa...", "...aa...aa...", "..aa.....aa.."
    ],
    "monkey": [
      "...aa.....aa...", "..aaaa...aaaa..", "...aabbbbbaa...", "..aabccccbbaa..",
      "..abcbddbcba..", "...abcccba...", "....abeba....", ".....aaa.....",
      "aa..aabaa..aa", ".aa.aabaa.aa.", "..aaababa....", "...aa...aa...", "..aa.....aa..",
      "...........aa.", "..........aa.."
    ],
    "panda": [
      "...bb.....bb...", "..bbb.....bbb..", "...bbaaaaabb...", "..bbaaaaaaabb..",
      "..baabbbaaaab..", "..baaacacaaab..", "...baadddaab...", "....baaaaab....",
      "bb..baaaaab..bb", ".bb.baaaaab.bb.", "..bbbaaaaabbb..", "....ba...ab....", "...bb.....bb..."
    ],
    "giraffe": [
      "....a.a........", "...aaaaa.......", "...abaca.......", "....aaa........",
      "....aba........", "....aba........", "....aba........", "....aba........",
      "....abaaaaa....", "....abababaa...", "....aaaaaaa..b.", "....a.a...a.bb.",
      "...aa.a...aa...", "...a..a....a...", "..aa..aa..aa..."
    ],
    "puppy": [
      "..aa.........aa..", ".aaaa.......aaaa.", "..aabbbbbbbbbaa..", "...abccccccba...",
      "...abcdddcba....", "....abceeba.....", ".....abfba......", "......aaa.......",
      "aa...aabaa...aa.", ".aa..aabaa..aa..", "..aa.aaaaa.aa...", "...aa.a.a.aa....", "....aa...aa....."
    ],
    "owl": [
      "..aa.........aa..", ".aaaa.......aaaa.", "..aabbbbbbbbbaa..", "...bbccdccbb....",
      "..bbcceeeccbb...", "...bbbcfcbbb....", "....bbbbbbb.....", ".....bbbbb......",
      "....bbgbgbb.....", "...bbgggggbb....", "....bb...bb....."
    ],
    "fall-fox": [
      "..aa.........aa..", ".aaaa.......aaaa.", "..aaabbbbbbbbaaa.", "...abccccccba...",
      "....bcdddc b....", ".....bcecb.....", "......bfb......", "......bbb......",
      "aa...bbbbb...aa", ".aa..bbnbb..aa.", "..aa.bbbbb.aa..", "....bb...bb....", "...bb.....bb...",
      "..........aaaa..", ".........aaaaaa."
    ].map(row => row.replace(/ /g, "")),
    "squirrel": [
      "...aa..........", "..aaaa......bbb.", "..abcaa....bbbbb", "...aaaa...bbbbbb",
      "....aaa..bbbbbb.", ".....aaabbbbb...", "aa..aaaaabbb....", ".aa.aaaaaaa.....",
      "..aaaaaaaaa.....", "...aaa.aaa......", "...aa...aa......", "..aa.....aa....."
    ],
    "lion": [
      "...ccc.....ccc...", "..ccccc...ccccc..", "...ccaaaaaaacc...", "..ccaaabaaaacc..",
      ".ccaaababa aaacc.", "..ccaaadddaaacc..", "...ccaaeaacc....", "....ccaaaacc.....",
      "aa...caaaaac...aa", ".aa..caaaaac..aa.", "..aa.caaaaac.aa..", "....cc...cc.....", "...cc.....cc...."
    ].map(row => row.replace(/ /g, "")),
    "zebra": [
      "....bb.....bb....", "...bbbb...bbbb...", "....bbaaaaabb....", "....ababbaba.....",
      "....baaacaaa.....", "....abadaaba.....", ".....aaaaa.......", "bb...abababa...bb",
      ".bb..baaaab..bb.", "..bb.ababa.bb...", "....ab...ba.....", "...ab.....ba....", "..abb.....bba..."
    ],
    "abc-blocks": [
      ".aaa...bbb...ccc.", "aaaaa.bbbbb.ccccc", "aanaa.bnnbb.cnncc", "aanaa.bnnbb.cnncc",
      "aaaaa.bbbbb.ccccc", ".aaa...bbb...ccc."
    ],
    "backpack": [
      "....aaaaa....", "...a.....a...", "..abbbbbbbba..", ".abccccccccba.",
      ".abcddddddcba.", ".abcddnnddcba.", ".abcddnnddcba.", ".abcddddddcba.",
      ".abccccccccba.", "..abbbbbbbba..", ".aa.........aa."
    ],
    "calculator": [
      ".aaaaaaaaaaa.", "abbbbbbbbbbba", "abbbbbbbbbbba", "accccccccccca",
      "acddcddcddcca", "acddcddcddcca", "aceeceeceecca", "aceeceeceecca", ".aaaaaaaaaaa."
    ],
    "glue-bottle": [
      "....aaa....", "...ababa...", "...aaaaa...", "..bbbbbbb..", ".bbbbbbbbb.",
      ".bcccccccb.", ".bccnnnncb.", ".bcccccccb.", ".bbbbbbbbb.", "..bbbbbbb.."
    ],
    "scissors": [
      "aaa.........aaa", "aaaa.......aaaa", ".aaa.......aaa.", "..aa.......aa..",
      "...aa.....aa...", "....aa...aa....", ".....aa.aa.....", "......aba......",
      ".....cc.cc.....", "....cc...cc....", "...cc.....cc..."
    ],
    "stack-of-books": [
      ".aaaaaaaaaaaa.", "abbbbbbbbbbbba", ".cccccccccccc.", "cddddddddddddc",
      ".eeeeeeeeeeee.", "efffffffffffffe", ".gggggggggggg.", "ghhhhhhhhhhhhg"
    ],
    "personalized-butterfly-keychain": ownerApprovedButterflyNameRows,
    "butterfly-and-flower": ownerApprovedButterflyFlowerRows,
    "butterfly-collection": ownerApprovedButterflyRows,
    "butterfly-name-keychain": ownerApprovedButterflyNameRows,
    "christmas-star": [
      "......a......", ".....aaa.....", "a...aaaaa...a", ".aaaaaaaaaaa.", "..aaaaaaaaa..",
      "...aaaaaaa...", "..aaaaaaaaa..", ".aaaa...aaaa.", "aaaa.....aaaa"
    ],
    "poinsettia": [
      "....a.....a....", "..aaaa...aaaa..", ".aaaaaa.aaaaaa.", "aaaabbbbbbaaaa", ".aaabbcccbbbaa.",
      "..aaabbbbbaaa..", "...dddbbbddd...", ".ddddd...ddddd.", "ddd.......ddd", ".dd.........dd."
    ],
    "christmas-truck": [
      "........d........", ".......ddd.......", "......ddddd......", ".....ddddddd.....",
      "..aaaaaaaaaaaa...", ".abbbbaaaaaaaa....", "abbbbbaacccaaaaaa", "aaaaaaaaaaaaaaaaa",
      "aaeeeeaaaaaeeeeaa", "..eeee.....eeee.."
    ],
    "christmas-teddy-bear": [
      "..aa.......aa..", ".aaaa.....aaaa.", "..aaaaaaaaaaa..", "...aabcbcbaa...", "....abdddba....",
      ".....abeba.....", "aa...aaaaa...aa", ".aa..aafaa..aa.", "..aa.aaaaa.aa..", "....aa.aa....", "...aa...aa..."
    ],
    "christmas-polar-bear": [
      "..aa.......aa..", ".aaaa.....aaaa.", "..aaaaaaaaaaa..", "...aabcbcbaa...", "....abdddba....",
      ".....abeba.....", "aa...fffff...aa", ".aa..ffgff..aa.", "..aa.fffff.aa..", "....aa.aa....", "...aa...aa..."
    ],
    "gingerbread-girl": [
      "....aaaaa....", "...aabbaa....", "..aabcbcbaa..", "...aadddaa...", "....abeba....",
      "aa..aaaaa..aa", ".aa.aafaa.aa.", "..aafffffaa..", ".aafffffffaa.", "...aa...aa...", "..aa.....aa.."
    ],
    "christmas-candy-cane": [
      "....aabb....", "...aabbaa...", "..aabbaa....", ".aabbaa.....", ".abbaa......",
      "..bbaa......", "..aabb......", "..bbaa......", "..aabbccaa..", ".aabbccccaa.", "aabbccccccaa"
    ],
    "christmas-tree": [
      ".....d.....", "....aaa....", "...aaaaa...", "..aabaaaa..", ".aaaaacaaaa.", "aaaabaaaaaaa",
      "..aaaaaaa..", ".aaacaaaaaa.", "aaaaaaaaaaa", "...eeee....", "...eeee....", "...eeee...."
    ],
    "christmas-snowflake": [
      "a.....a.....a", ".a....a....a.", "..a...a...a..", "...a..a..a...", "....aaaaa....",
      "aaaaaaaaaaaaa", "....aaaaa....", "...a..a..a...", "..a...a...a..", ".a....a....a.", "a.....a.....a"
    ],
    "gingerbread-man": [
      "....aaaaa....", "...aabbaa....", "..aabcbcbaa..", "...aadddaa...", "....abeba....",
      "aa..aaaaa..aa", ".aa.aafaa.aa.", "..aaagaaa....", "...aa...aa...", "..aa.....aa.."
    ],
    "christmas-angel": [
      ".....ddd.....", "....daaad....", "....abcba....", "...aabbbaa...", "..eeebbbeee..",
      ".eeeeebbbeeeee.", "...bbbbbbb...", "..bbbbbbbbb..", ".bbbbbbbbbbb.", "....bb.bb...."
    ],
    "christmas-snowman": [
      "...bbbbbbb...", "....bbbbb....", "....aaaaa....", "...aacacaa...", "....aadaa....",
      "....eeeee....", "...aaaaaaa...", "..aaaaaaaaa..", "..aaaafaaaa..", "...aaaaaaa...", "....aa.aa...."
    ],
    "christmas-reindeer": [
      "aa.........aa", ".aa.......aa.", "..aa.....aa..", "...aa...aa...", "....bbbbb....",
      "...bbbbbbb...", "..bbcbdcbb...", "...bbebb.....", "aa..bbbbb..aa", ".aa.bbbbb.aa.", "...bb...bb...", "..bb.....bb.."
    ],
    "christmas-elf": [
      ".....a.....", "....aaa....", "...aaaaa...", "..aabbbbb..", ".bbbcbbcbb.", "..bbbbbbb..",
      "cccddeedccc", "...ddddd...", "...ddddd...", "..ff...ff..", ".fff...fff."
    ],
    "mrs-claus": [
      "....aaa....", "...aaaaa...", "..aabbbbaa..", ".bbbbcbbbb.", ".bbcbdcbb.", "..bbeebbb..",
      "cccaaddaccc", "...aaaaa...", "..aafffaa..", ".aafffffaa.", "..gg...gg.."
    ],
    "christmas-santa": [
      "....aaa....", "...aaaaa...", "..aabbbbaa..", ".bbbbcbbbb.", ".bbcbdcbb.", "..bbeebbb..",
      "cccaaddaccc", "...aaaaa...", "..aaeeeaa..", "..aa...aa..", ".fff...fff."
    ],
    "unicorn": [
      ".........c.....", "........cc.....", "...aa..ccc.....", "..aaaab.........", ".aaabaaaa.......",
      "aabcbcaaaa......", ".aadddaaaa......", "..aaaaaaa......", "aa..aaaaa...ee.", ".aa.aaaaaaa.eee",
      "..aaa...aaaee..", "...aa...aa.....", "..aa.....aa...."
    ],
    "magical-mane-unicorn": [
      ".........c.....", "........cc.....", "...aa..ccc.....", "..aaaab.........", ".aaabaaaa.......",
      "aabcbcaaaa......", ".aadddaaaa......", "..aaaaaaa......", "aa..aaaaa...eee", ".aa.aaaaaaa.eeee",
      "..aaa...aaaeee.", "...aa...aa.....", "..aa.....aa...."
    ],
    "ariel": [
      "....aaaaa....", "...aabbaa....", "..aabcbcbaa..", "...aadddaa...", "cc..ddddd..cc",
      ".cc.ddddd.cc.", "....eeeee....", "....eeeee....", "...eeeeeee...", "....eeeee....",
      ".....eee.....", "....ee.ee....", "...ee...ee..."
    ],
    "fall-maple-leaf": [
      "......a......", "..a...aaa...a..", ".aaa.aaaaa.aaa.", "aaaaaaaaaaaaaaa", ".aaaaaaaaaaaaa.",
      "...aaaaaaaaa...", ".....aaaaa.....", "......bbb......", "......bbb......", ".....bbbbb....."
    ],
    "fall-sunflower": [
      "....aaa....", "..aabbbaa..", ".aabbbbbaa.", "aabbcccbbaa", ".aabbbbbaa.", "..aabbbaa..",
      "....ddd....", "...ddddd...", "..ddd.ddd..", "....ddd....", "....ddd...."
    ],
    "fall-coffee-cup": [
      "....ccccc....", "...ccccccc...", "..bbbbbbbbb..", ".baaaaaaaaab.", ".baaannnaaab.",
      ".baaannnaaabb", ".baaannnaaabb", ".baaaaaaaaabb", "..baaaaaabbb", "...bbbbbbb.."
    ],
    "fall-leaves-keychain": [
      ".aaa.........bbb.", "aaaaa.......bbbbb", ".aaaaa.....bbbbb.", "..aaa.......bbb..", "...c.........c...",
      "......ddd........", ".....ddddd.......", "....ddddddd......", ".....ddddd.......", "......ddd........", ".......c........."
    ],
    "autumn-tree": [
      ".....a.....", "...aacaa...", "..aaacaaa..", ".aaaacaaaa.", "aaaaacaaaaa", ".aaaacaaaa.",
      "..aaacaaa..", "...bbbbb...", "....bbb....", "....bbb....", "...bbbbb..."
    ],
    "scarf": [
      "...aaaa...", "..abbbba..", ".abccccba.", "..abbbba..", "...aaaa...", "...ab.....",
      "..ab......", ".ab.......", ".ab.......", "..b.......", ".b.b......"
    ],
    "hot-chocolate": [
      "....ccc....", "...ccccc...", "..bbbbbbb..", ".baaaaaaab.", ".baaannnaabb",
      ".baaannnaa.b", ".baaaaaaa..b", "..baaaaab..", "...bbbbb...", "...ddddd..."
    ],
    "pumpkin-spice-latte": [
      "....ccccc....", "...ccccccc...", "..bbbbbbbbb..", ".baaaaaaaaab.", ".baaannnaaab.",
      ".baaannnaaabb", ".baaannnaaabb", ".baaaaaaaaabb", "..baaaaaabbb", "...bbbbbbb..", "....ddddd...."
    ],
    "deluxe-flower": [
      ".....aaa.....", "..aaabbbaaa..", ".aabbbbbbbbb..", "aabbbcccbbbaa", ".aabbbbbbbbaa.",
      "..aaabbbaaa..", ".....ddd.....", "...ddeddd....", "..dddedddd...", ".....ddd....."
    ],
    "flower-braided": [
      "....aaa....", "..aabbbaa..", ".aabbbbbaa.", "..aabbbaa..", "....ccc....", "...cdcdc...",
      "....ccc....", "...cecec...", "....ccc....", "...cfcfc...", "....ccc....", "...c...c..."
    ],
    "big-flower": [
      "....aaa....", "..aaabaaa..", ".aaabbbbaaa.", "aaabccccbaaa", ".aaabbbbaaa.",
      "..aaabaaa..", "....ddd....", "...ddddd...", "..ddd.ddd..", "....ddd....", "....ddd...."
    ],
    "pastel-flower-bar-keychain": [
      "..aaa...aaa..", ".aabaa.aabaa.", "..aaa...aaa..", "...c.....c...", "..ddd...ddd..",
      ".deded.deded.", "..ddd...ddd..", "...c.....c...", "....ccccc...."
    ],
    "blue-flower-keychain": [
      "....aaa....", "..aabbbaa..", ".aabbbbbaa.", "aabbcccbb aa", ".aabbbbbaa.",
      "..aabbbaa..", "....ddd....", "...ddddd...", "..ddd.ddd..", "....ddd....", "...ed.de...", "..ee.d.ee..", "....ddd...."
    ].map(row => row.replace(/ /g, "")),
    "rainbow-name-keychain": [
      "..aabbccddee..", ".aabbccddeeff.", "aabbccddeeffgg", "......nnn.....", "......nnn.....",
      "......nnn.....", "......nnn.....", "......nnn.....", ".....h...h...."
    ],
    "turtle": [
      ".....aa.........", "...aabbaa.......", "..aabbbbaa...cc.", ".aabbbbbbaa.cccc", "aabbbbbbbbaacdcc",
      ".aabbbbbbaa.cccc", "..aabbbbaa...cc.", "d...aaaa...d....", ".dd......dd.....", "..d......d......"
    ],
    "personalized-turtle-keychain": [
      ".....aa.........", "...aabbaa.......", "..aabbbbaa...cc.", ".aabbbbbbaa.cccc", "aabbbbbbbbaacdcc",
      ".aabbbbbbaa.cccc", "..aabbbbaa...cc.", "d...aaaa...d....", "....nnn.........", "....nnn.........",
      "....nnn.........", "....nnn.........", "...e...e........"
    ],
    "whale": [
      ".............aa", "...........aaaa", "....aaaaaaaaaa.", "..aaaaaaaaaaaa.", ".aabaaaaaaaaaa..",
      "aabccccaaaaa....", ".aaaaaaaaa......", "..aaaaaaa.......", "...aa..aa.......", "..aa....aa......"
    ],
    "lobster": [
      "aa.........aa", "aaa.......aaa", ".aa...b...aa.", "..aa.bbb.aa..", "...aabcbbaa...",
      ".....bbb.....", "....bbbbb....", ".....bbb.....", "....bbbbb....", "...bb...bb...", "..bb.....bb.."
    ],
    "shark": [
      ".........aa.....", "........aaaa....", "...aaaaaaaaaaa..", ".aaaaaaaaaaaaaaa", "aabccccccaaaaaaa",
      ".aaaaaaaaaaaaaaa", "...aaaaaaaaaaa..", ".....aa..aa.....", "....aa....aa...."
    ],
    "palm-tree": [
      "....aaa.aaa....", "..aaaaaaaaaaa..", ".aaaaaabaaaaaa.", "...aaa.b.aaa...", "......bbb......",
      ".......b.......", ".......b.......", "......bbb......", "......bbb......", ".....bbbbb.....", "....bbbbbbb...."
    ],
    "ladybug-backpack": [
      "....bbbb....", "...bbbbbb...", "..bbccccbb..", ".bbcaaccabb.", ".bcacccacb.", ".bcacccacb.",
      ".bcacccacb.", ".bbcaaccabb.", "..bbccccbb..", "...bbbbbb...", "....bbbb...."
    ]
  };

  const provisionalPatternsBySlug = Object.freeze(Object.fromEntries(
    Object.entries({ ...provisionalPatternRows, ...ownerCorrectedPatternRows }).map(([slug, rows]) => [slug, patternFromRows(rows)])
  ));
  const provisionalPartLabelsBySlug = Object.freeze({
    "best-friends-forever-bracelet": ["Second colour", "Heart accent"],
    "unicorn-dreams-bracelet": ["Pearl accents", "Heart accent"],
    "mermaid-wishes-bracelet": ["Ocean accents", "Heart accent"],
    "sweetheart-bracelet": ["Second colour", "Heart accent"],
    "pearl-glow-bracelet": ["Pearl accents", "Heart accent"],
    "personalized-butterfly-keychain": ["Lower wings", "Pearl body", "Antennae", "Name loop"],
    "personalized-blossom-keychain": ["Petal details", "Flower centre", "Name strand", "Dangles"],
    "butterfly-with-flowers": ["Lower wings", "Pearl body", "Antennae", "Flowers"],
    "personalized-turtle-keychain": ["Shell", "Face", "Name strand", "Feet"],
    "personalized-scripture-dove-keychain": ["Wing", "Beak", "Scripture strand", "Tail"],
    "butterfly-collection": ["Lower wings", "Pearl body", "Antennae"],
    "butterfly-name-keychain": ["Lower wings", "Pearl body", "Antennae", "Name loop"],
    "flower-braided": ["Petal details", "Centre", "Braided strand", "Leaves"],
    "intricated-flower": ["Inner petals", "Centre", "Stem", "Leaves"],
    "butterfly-and-flower": ["Lower wings", "Pearl body", "Antennae", "Flower petals", "Flower centre"],
    "abc-blocks": ["Block two", "Block three", "Letters", "Edging"],
    "backpack": ["Pocket", "Trim", "Straps", "Details"],
    "school-bus": ["Windows", "Trim", "Wheels", "Lights"],
    "ruler": ["Markings", "Edge", "Details"],
    "calculator": ["Screen", "Buttons", "Button details", "Trim"],
    "glue-bottle": ["Cap", "Label", "Label details", "Outline"],
    "scissors": ["Handles", "Blades", "Pivot", "Details"],
    "lunch-box": ["Trim", "Front panel", "Handle", "Details"],
    "stack-of-books": ["Book two", "Book three", "Pages", "Spines"],
    "owl": ["Face", "Eyes", "Beak", "Chest"],
    "fall-fox": ["Face", "Chest", "Eyes", "Feet"],
    "fall-maple-leaf": ["Leaf accents", "Stem", "Veins"],
    "fall-sunflower": ["Centre", "Stem", "Leaves", "Petal accents"],
    "fall-leaves-keychain": ["Second leaf", "Third leaf", "Stems", "Accents"],
    "spider-man": ["Webbing", "Eyes", "Suit details", "Outline"],
    "spider-man-version-1": ["Webbing", "Eyes", "Suit details", "Outline"],
    "christmas-star": ["Inner star", "Outline", "Highlights"],
    "poinsettia": ["Inner petals", "Centre", "Leaves", "Stem"],
    "christmas-truck": ["Tree", "Windows", "Wheels", "Trim"],
    "christmas-teddy-bear": ["Muzzle", "Eyes", "Bow", "Paws"],
    "christmas-polar-bear": ["Hat and scarf", "Face", "Cheeks", "Muzzle"],
    "gingerbread-girl": ["Icing", "Bow", "Heart", "Face"],
    "christmas-wreath": ["Bow", "Berries", "Golden accents", "Foliage details"],
    "christmas-candy-cane": ["White stripe", "Bow", "Holly", "Details"],
    "christmas-present": ["Ribbon", "Bow", "Highlights", "Outline"],
    "christmas-stocking": ["Cuff", "Holly", "Toe and heel", "Details"],
    "christmas-tree": ["Ornaments", "Garland", "Star", "Trunk"],
    "christmas-snowflake": ["Centres", "Crystal tips", "Highlights", "Outline"],
    "gingerbread-man": ["Icing", "Bow", "Buttons", "Face"],
    "christmas-angel": ["Wings", "Halo", "Face", "Dress details"],
    "christmas-snowman": ["Hat", "Scarf", "Arms", "Face"],
    "christmas-reindeer": ["Antlers", "Chest", "Nose", "Hooves"],
    "christmas-elf": ["Suit details", "Face", "Belt", "Shoes"],
    "glow-in-the-dark-christmas-ornament": ["Glow mix two", "Glow mix three", "Glow mix four", "Glow mix five"],
    "mrs-claus": ["Trim", "Face", "Belt", "Boots"],
    "christmas-santa": ["Trim", "Face", "Belt", "Boots"]
  });

  const products = [
    {
      id: 12,
      slug: "natalies-butterfly",
      name: "Natalie’s Butterfly",
      category: "Nature",
      description: "A distinct handmade butterfly keepsake inspired by Natalie’s colours.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/natalies-butterfly-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/natalies-butterfly-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/natalies-butterfly-owner-approved-master.jpg",
      previewPattern: previewPatterns.butterfly,
      defaultColours: ["pink", "purple", "orange", "teal"],
      photoFocusClass: "focus-natalies-butterfly",
      active: true,
      sortOrder: 5
    },
    {
      id: 1,
      slug: "butterfly",
      name: "Butterfly",
      category: "Butterfly",
      collections: ["Butterfly", "Mother's Day"],
      description: "A handmade beaded butterfly design.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/butterfly-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/butterfly-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/butterfly-owner-approved-master.jpg",
      previewPattern: previewPatterns.butterfly,
      defaultColours: ["pink", "purple", "white", "pearl"],
      active: true,
      sortOrder: 10
    },
    {
      id: 171,
      slug: "personalized-butterfly-keychain",
      name: "Personalized Butterfly Keychain",
      category: "Butterfly",
      collections: ["Butterfly"],
      description: "A personalized handmade butterfly keychain with a custom letter-bead name loop.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/products/personalized-butterfly-keychain.jpg",
      referenceImageUrl: "images/products/personalized-butterfly-keychain.jpg",
      previewImageUrl: "images/products/personalized-butterfly-keychain.jpg",
      additionalImageUrls: ["images/products/personalized-butterfly-keychain-example-2.jpg"],
      previewPattern: previewPatterns.butterfly,
      defaultColours: ["pink", "purple", "black"],
      supportsPersonalization: true,
      active: true,
      sortOrder: 10.5
    },
    {
      id: 2,
      slug: "gecko",
      name: "Gecko Keychain",
      category: "Tiny Garden Friends",
      description: "A turquoise and purple handmade gecko keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/gecko-tiny-garden-branded.png",
      referenceImageUrl: "etsy/images-branded/gecko-tiny-garden-branded.png",
      previewImageUrl: "etsy/images-branded/gecko-tiny-garden-branded.png",
      previewPattern: previewPatterns.gecko,
      defaultColours: ["turquoise", "blue", "white"],
      active: true,
      sortOrder: 20
    },
    {
      id: 174,
      slug: "frog-keychain",
      name: "Frog Keychain",
      category: "Pond Friends",
      collections: ["Pond Friends"],
      description: "A cheerful handmade pony-bead frog keychain with customizable colours and optional name personalization.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/products/frog-keychain.jpg",
      referenceImageUrl: "images/products/frog-keychain.jpg",
      previewImageUrl: "images/products/frog-keychain.jpg",
      originalSourceImageUrl: "images/products/frog-keychain.jpg",
      imageClassification: "owner-approved-original",
      constructionReferenceImageUrl: "images/products/frog-keychain-owner-construction-reference-original.jpg",
      constructionReferenceClassification: "owner-supplied-original-photo",
      previewPattern: previewPatterns.frog,
      defaultColours: ["green", "red", "black"],
      previewAccentDefault: "Red",
      previewPartDefaults: {
        "Body": "Green",
        "Arms and legs": "Green",
        "Fingers and toes": "Black"
      },
      supportsPersonalization: true,
      personalizationLabel: "Optional name personalization",
      personalizationPlaceholder: "e.g. Natalie",
      personalizationMaxLength: 12,
      active: true,
      sortOrder: 21
    },
    {
      id: 3,
      slug: "flower",
      name: "Flower",
      category: "Nature",
      description: "A handmade beaded flower design.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/flower-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/flower-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/flower-owner-approved-master.jpg",
      previewPattern: previewPatterns.flower,
      defaultColours: ["pink", "green", "cream"],
      active: true,
      sortOrder: 30
    },
    {
      id: 175,
      slug: "personalized-blossom-keychain",
      name: "Personalized Blossom Keychain",
      category: "Flower",
      collections: ["Flower", "Mother's Day"],
      description: "A personalized handmade pony-bead blossom keychain with pearl accents, a gold centre bead, heart accents, and decorative strands.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "images/products/personalized-blossom-keychain-edited-natalie.png",
      referenceImageUrl: "images/products/personalized-blossom-keychain-edited-natalie.png",
      previewImageUrl: "images/products/personalized-blossom-keychain-edited-natalie.png",
      originalSourceImageUrl: "images/products/personalized-blossom-keychain-original.jpg",
      imageClassification: "edited-styled-example",
      imageEditDisclosure: "The storefront example was edited to correct the letter-bead name from NATLIE to NATALIE. The supplied original is preserved separately.",
      previewPattern: previewPatterns.flower,
      defaultColours: ["pink", "pearl", "gold", "lavender"],
      supportsPersonalization: true,
      personalizationLabel: "Personalized name or short text",
      personalizationPlaceholder: "e.g. Natalie",
      personalizationMaxLength: 12,
      active: true,
      sortOrder: 31
    },
    {
      id: 11,
      slug: "big-flower",
      name: "Big Flower",
      category: "Flower",
      collections: ["Mother's Day"],
      description: "Large handmade beaded flower design",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/big-flower-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/big-flower-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/big-flower-approved-master.jpg",
      previewPattern: previewPatterns.bigFlower,
      defaultColours: ["blue", "purple", "green"],
      active: true,
      sortOrder: 35
    },
    {
      id: 19,
      slug: "deluxe-flower",
      name: "Deluxe Flower",
      category: "Flower",
      description: "Intricate handmade beaded flower design.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/deluxe-flower-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/deluxe-flower-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/deluxe-flower-owner-approved-master.jpg",
      previewPattern: previewPatterns.flower,
      defaultColours: ["purple", "green", "cream"],
      active: true,
      sortOrder: 37
    },
    {
      id: 4,
      slug: "butterfly-with-flowers",
      name: "Butterfly with Flowers",
      category: "Nature",
      description: "A handmade butterfly and flower keepsake.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "etsy/images-branded/phoenix-butterfly-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/phoenix-butterfly-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/phoenix-butterfly-owner-approved-master.jpg",
      previewPattern: previewPatterns.butterflyWithFlowers,
      defaultColours: ["pink", "black", "red", "orange"],
      active: true,
      sortOrder: 40
    },
    {
      id: 5,
      slug: "macaw",
      name: "Macaw",
      category: "Birds",
      description: "A colourful handmade macaw keychain, made to order.",
      basePriceCents: 4700,
      basePrice: 4700,
      imageUrl: "etsy/images-branded/macaw-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/macaw-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/macaw-owner-approved-master.jpg",
      previewPattern: previewPatterns.macaw,
      defaultColours: ["red", "black", "white", "orange"],
      active: true,
      sortOrder: 50
    },
    {
      id: 13,
      slug: "fish",
      name: "Fish",
      category: "Ocean Animals",
      description: "A handmade beaded fish design.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/fish-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/fish-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/fish-approved-master.jpg",
      previewPattern: previewPatterns.fish,
      defaultColours: ["pink", "blue", "orange", "teal"],
      active: true,
      disabledReason: "",
      sortOrder: 52
    },
    {
      id: 14,
      slug: "crab",
      name: "Crab",
      category: "Sandy Beaches",
      description: "A handmade beaded crab design.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/crab-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/crab-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/crab-approved-master.jpg",
      previewPattern: previewPatterns.crab,
      defaultColours: ["red", "teal", "white"],
      active: true,
      disabledReason: "",
      sortOrder: 54
    },
    {
      id: 15,
      slug: "penguin",
      name: "Penguin",
      category: "Arctic Ocean Animals",
      description: "A handmade beaded penguin design for the Arctic side of the Ocean Animals collection.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/penguin-etsy-branded.jpg",
      referenceImageUrl: "etsy/images-branded/penguin-etsy-branded.jpg",
      previewImageUrl: "etsy/images-branded/penguin-etsy-branded.jpg",
      previewPattern: previewPatterns.penguin,
      defaultColours: ["black", "white", "orange"],
      previewColourParts: ["Belly", "Beak and feet"],
      previewPartDefaults: { "Belly": "White", "Beak and feet": "Orange" },
      previewSupportsAccent: false,
      active: true,
      disabledReason: "",
      sortOrder: 56
    },
    {
      id: 20,
      slug: "turtle",
      name: "Turtle",
      category: "Ocean Animals",
      description: "A handmade beaded turtle design.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/turtle-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/turtle-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/turtle-approved-master.jpg",
      previewPattern: previewPatterns.turtle,
      defaultColours: ["green", "brown", "cream"],
      active: true,
      sortOrder: 58
    },
    {
      id: 172,
      slug: "personalized-turtle-keychain",
      name: "Personalized Turtle Keychain",
      category: "Ocean Animals",
      description: "A personalized handmade turtle keychain with the customer name incorporated across the shell.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/products/personalized-turtle-keychain.jpg",
      referenceImageUrl: "images/products/personalized-turtle-keychain.jpg",
      previewImageUrl: "images/products/personalized-turtle-keychain.jpg",
      previewPattern: previewPatterns.turtle,
      defaultColours: ["green", "brown", "blue"],
      supportsPersonalization: true,
      active: true,
      sortOrder: 58.5
    },
    {
      id: 21,
      slug: "whale",
      name: "Whale",
      category: "Ocean Animals",
      description: "A calm handmade beaded whale design with deep-ocean charm.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/whale-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/whale-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/whale-approved-master.jpg",
      previewPattern: previewPatterns.whale,
      defaultColours: ["blue", "white", "teal"],
      active: true,
      disabledReason: "",
      sortOrder: 59
    },
    {
      id: 22,
      slug: "jellyfish",
      name: "Jellyfish",
      category: "Ocean Animals",
      description: "A graceful handmade beaded jellyfish design inspired by drifting sea light.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/jellyfish-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/jellyfish-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/jellyfish-approved-master.jpg",
      previewPattern: previewPatterns.jellyfish,
      defaultColours: ["pink", "purple", "teal"],
      active: true,
      disabledReason: "",
      sortOrder: 59.2
    },
    {
      id: 23,
      slug: "lobster",
      name: "Lobster",
      category: "Ocean Animals",
      description: "A bright handmade beaded lobster design with coastal character.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/lobster-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/lobster-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/lobster-owner-approved-master.jpg",
      previewPattern: previewPatterns.lobster,
      defaultColours: ["red", "orange", "white"],
      active: true,
      disabledReason: "",
      sortOrder: 59.4
    },
    {
      id: 24,
      slug: "shark",
      name: "Shark",
      category: "Ocean Animals",
      description: "A bold handmade beaded shark design for ocean-piece collectors.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/shark-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/shark-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/shark-approved-master.jpg",
      previewPattern: previewPatterns.shark,
      defaultColours: ["grey", "white", "blue"],
      active: true,
      disabledReason: "",
      sortOrder: 59.6
    },
    {
      id: 6,
      slug: "faith-cross",
      name: "Faith Cross",
      category: "Faith",
      description: "A handmade purple-and-turquoise cross spelling FAITH.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/faith-cross-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/faith-cross-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/faith-cross-owner-approved-master.jpg",
      previewPattern: previewPatterns.cross,
      defaultColours: ["pink", "white"],
      active: true,
      sortOrder: 60
    },
    {
      id: 112,
      slug: "joy-cross",
      name: "Joy Cross",
      category: "Faith",
      description: "A handmade blue-and-purple cross spelling JOY.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/joy-cross-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/joy-cross-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/joy-cross-owner-approved-master.jpg",
      previewPattern: previewPatterns.cross,
      defaultColours: ["blue", "purple"],
      active: true,
      sortOrder: 61
    },
    {
      id: 113,
      slug: "peace-cross",
      name: "Peace Cross",
      category: "Faith",
      description: "A handmade pink-and-white cross spelling PEACE.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/peace-cross-owner-approved-master-v2.png",
      referenceImageUrl: "etsy/images-branded/peace-cross-owner-approved-master-v2.png",
      previewImageUrl: "etsy/images-branded/peace-cross-owner-approved-master-v2.png",
      previewPattern: previewPatterns.cross,
      defaultColours: ["pink", "white"],
      active: true,
      sortOrder: 62
    },
    {
      id: 173,
      slug: "personalized-scripture-dove-keychain",
      legacySlugs: ["personalized-scripture-cross-keychain"],
      name: "Personalized Scripture Dove Keychain",
      category: "Faith",
      collections: ["Faith"],
      description: "A personalized handmade beaded dove carrying a branch with a short Scripture or faith reference strand.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "images/products/personalized-scripture-dove-keychain.jpg",
      referenceImageUrl: "images/products/personalized-scripture-dove-keychain.jpg",
      previewImageUrl: "images/products/personalized-scripture-dove-keychain.jpg",
      previewPattern: previewPatterns.dove,
      defaultColours: ["white", "grey", "yellow", "green", "brown"],
      supportsPersonalization: true,
      personalizationLabel: "Scripture reference / short faith reference",
      personalizationPlaceholder: "e.g. ISAIAH 41:10",
      personalizationMaxLength: 12,
      active: true,
      sortOrder: 63
    },
    {
      id: 7,
      slug: "pencil",
      name: "Colouring Pencil",
      category: "Back to School",
      description: "A personalized beaded pencil design.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/colouring-pencil-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/colouring-pencil-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/colouring-pencil-owner-approved-master.jpg",
      previewPattern: previewPatterns.pencil,
      defaultColours: ["blue", "black"],
      active: true,
      sortOrder: 70
    },
    {
      id: 8,
      slug: "octopus",
      name: "Octopus",
      category: "Ocean Animals",
      description: "A handmade octopus inspired beaded design.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "etsy/images-branded/octopus-etsy-branded.jpg",
      referenceImageUrl: "etsy/images-branded/octopus-etsy-branded.jpg",
      previewImageUrl: "etsy/images-branded/octopus-etsy-branded.jpg",
      previewPattern: previewPatterns.octopus,
      defaultColours: ["pink", "teal", "black"],
      active: true,
      sortOrder: 80
    },
    {
      id: 9,
      slug: "soccer-ball",
      name: "Soccer Ball",
      category: "Sports",
      description: "A handmade soccer ball inspired beaded design.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/sports/soccer-ball.jpg",
      referenceImageUrl: "images/sports/soccer-ball.jpg",
      previewImageUrl: "images/sports/soccer-ball.jpg",
      previewPattern: previewPatterns.soccerBall,
      defaultColours: ["white", "black"],
      active: true,
      sortOrder: 90
    },
    {
      id: 118,
      slug: "basketball",
      name: "Basketball",
      category: "Sports",
      description: "A personalized flat pony-bead basketball keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/sports/basketball.jpg",
      referenceImageUrl: "images/sports/basketball.jpg",
      previewImageUrl: "images/sports/basketball.jpg",
      previewPattern: previewPatterns.basketball,
      defaultColours: ["orange", "black", "white"],
      active: true,
      sortOrder: 91
    },
    {
      id: 119,
      slug: "baseball",
      name: "Baseball",
      category: "Sports",
      description: "A personalized flat pony-bead baseball keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/sports/baseball.jpg",
      referenceImageUrl: "images/sports/baseball.jpg",
      previewImageUrl: "images/sports/baseball.jpg",
      previewPattern: previewPatterns.baseball,
      defaultColours: ["white", "red"],
      active: true,
      sortOrder: 92
    },
    {
      id: 120,
      slug: "best-friends-forever-bracelet",
      name: "Best Friends Forever Bracelet",
      category: "Accessories",
      description: "A personalized friendship bracelet made with any two names and favourite colours.",
      basePriceCents: 1500,
      basePrice: 1500,
      imageUrl: "images/accessories/best-friends-forever-bracelet.jpg",
      referenceImageUrl: "images/accessories/best-friends-forever-bracelet.jpg",
      previewImageUrl: "images/accessories/best-friends-forever-bracelet.jpg",
      previewPattern: previewPatterns.bracelet,
      defaultColours: ["purple", "pink", "blue", "green"],
      active: true,
      sortOrder: 93
    },
    {
      id: 121,
      slug: "unicorn-dreams-bracelet",
      name: "Unicorn Dreams Bracelet",
      category: "Accessories",
      description: "A personalized magical bracelet with pearly beads and a heart detail.",
      basePriceCents: 1500,
      basePrice: 1500,
      imageUrl: "images/accessories/unicorn-dreams-bracelet.jpg",
      referenceImageUrl: "images/accessories/unicorn-dreams-bracelet.jpg",
      previewImageUrl: "images/accessories/unicorn-dreams-bracelet.jpg",
      previewPattern: previewPatterns.bracelet,
      defaultColours: ["pink", "purple", "blue", "white"],
      active: true,
      sortOrder: 94
    },
    {
      id: 122,
      slug: "mermaid-wishes-bracelet",
      name: "Mermaid Wishes Bracelet",
      category: "Accessories",
      description: "A personalized ocean-coloured bracelet with pearly beads and a heart detail.",
      basePriceCents: 1500,
      basePrice: 1500,
      imageUrl: "images/accessories/mermaid-wishes-bracelet.jpg",
      referenceImageUrl: "images/accessories/mermaid-wishes-bracelet.jpg",
      previewImageUrl: "images/accessories/mermaid-wishes-bracelet.jpg",
      previewPattern: previewPatterns.bracelet,
      defaultColours: ["aqua", "purple", "pink", "white"],
      active: true,
      sortOrder: 95
    },
    {
      id: 123,
      slug: "sweetheart-bracelet",
      name: "Sweetheart Bracelet",
      category: "Accessories",
      collections: ["Valentine's"],
      description: "A personalized heart-name bracelet in bright, playful colours.",
      basePriceCents: 1500,
      basePrice: 1500,
      imageUrl: "images/accessories/sweetheart-bracelet.jpg",
      referenceImageUrl: "images/accessories/sweetheart-bracelet.jpg",
      previewImageUrl: "images/accessories/sweetheart-bracelet.jpg",
      previewPattern: previewPatterns.bracelet,
      defaultColours: ["pink", "purple", "blue", "white"],
      active: true,
      sortOrder: 96
    },
    {
      id: 136,
      slug: "personalized-love-heart-keychain",
      name: "Personalized Love Heart Keychain",
      category: "Valentine's",
      collections: ["Valentine's"],
      description: "A personalized heart-shaped keepsake handmade for someone you love.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "etsy/images-branded/personalized-love-heart-keychain-approved.jpg",
      referenceImageUrl: "etsy/images-branded/personalized-love-heart-keychain-approved.jpg",
      previewImageUrl: "etsy/images-branded/personalized-love-heart-keychain-approved.jpg",
      previewPattern: previewPatterns.loveHeart,
      defaultColours: ["pink", "red", "white", "pearl"],
      active: true,
      sortOrder: 96.1
    },
    {
      id: 124,
      slug: "pearl-glow-bracelet",
      name: "Pearl Glow Bracelet",
      category: "Accessories",
      description: "A personalized name bracelet with luminous pearl-style beads.",
      basePriceCents: 1500,
      basePrice: 1500,
      imageUrl: "images/accessories/pearl-glow-bracelet.jpg",
      referenceImageUrl: "images/accessories/pearl-glow-bracelet.jpg",
      previewImageUrl: "images/accessories/pearl-glow-bracelet.jpg",
      previewPattern: previewPatterns.bracelet,
      defaultColours: ["aqua", "purple", "pink", "white"],
      active: true,
      sortOrder: 97
    },
    {
      id: 170,
      slug: "flower-beaded-lanyard",
      name: "Flower Beaded Lanyard",
      category: "Accessories",
      collections: ["Accessories", "Flower"],
      description: "A colourful handmade beaded flower lanyard with coordinated clasp hardware.",
      basePriceCents: 4500,
      basePrice: 4500,
      imageUrl: "images/accessories/flower-beaded-lanyard.jpg",
      referenceImageUrl: "images/accessories/flower-beaded-lanyard.jpg",
      previewImageUrl: "images/accessories/flower-beaded-lanyard.jpg",
      previewPattern: previewPatterns.flowerLanyard,
      defaultColours: ["pink", "turquoise", "orange", "purple", "yellow", "white"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 97.5
    },
    {
      id: 10,
      slug: "custom-idea",
      name: "Custom Idea",
      category: "Custom",
      description: "A general reference for a fully custom beaded idea.",
      basePriceCents: 3500,
      basePrice: 3500,
      imageUrl: "etsy/images-branded/custom-idea-etsy-branded.jpg",
      referenceImageUrl: "etsy/images-branded/custom-idea-etsy-branded.jpg",
      previewImageUrl: "etsy/images-branded/custom-idea-etsy-branded.jpg",
      previewPattern: null,
      defaultColours: ["purple", "cream", "gold"],
      active: true,
      sortOrder: 100
    },
    {
      id: 16,
      slug: "mushroom",
      name: "Mushroom",
      category: "Nature",
      description: "A handmade beaded mushroom design.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/mushroom-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/mushroom-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/mushroom-approved-master.jpg",
      previewPattern: previewPatterns.mushroom,
      defaultColours: ["red", "cream", "brown"],
      active: true,
      disabledReason: "",
      sortOrder: 110
    },
    {
      id: 17,
      slug: "tiger",
      name: "Tiger",
      category: "Animals",
      description: "A bold orange, black, and white handmade beaded tiger keychain.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "etsy/images-branded/tiger-safari-owner-approved.jpg",
      referenceImageUrl: "etsy/images-branded/tiger-safari-owner-approved.jpg",
      previewImageUrl: "etsy/images-branded/tiger-safari-owner-approved.jpg",
      previewPattern: previewPatterns.tiger,
      defaultColours: ["orange", "black", "white"],
      active: true,
      disabledReason: "",
      sortOrder: 120
    },
    {
      id: 27,
      slug: "ladybug-backpack",
      name: "Ladybug",
      category: "Tiny Garden Friends",
      description: "A personalized handmade ladybug backpack keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/ladybug-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/ladybug-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/ladybug-approved-master.jpg",
      previewPattern: previewPatterns.ladybug,
      defaultColours: ["red", "black", "white"],
      active: true,
      sortOrder: 121
    },
    {
      id: 28,
      slug: "dragonfly-keychain",
      name: "Dragonfly Keychain",
      category: "Tiny Garden Friends",
      description: "A colourful handmade dragonfly keychain with optional personalization.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/dragonfly-keychain-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/dragonfly-keychain-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/dragonfly-keychain-approved-master.jpg",
      previewPattern: previewPatterns.dragonfly,
      defaultColours: ["green", "purple", "white"],
      active: true,
      sortOrder: 122
    },
    {
      id: 29,
      slug: "unicorn",
      name: "Unicorn",
      category: "Enchanted Beings",
      description: "A magical handmade beaded unicorn, made to order in your favourite colours.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/unicorn-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/unicorn-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/unicorn-owner-approved-master.jpg",
      previewPattern: previewPatterns.unicorn,
      defaultColours: ["white", "purple", "pink", "yellow"],
      active: true,
      sortOrder: 123
    },
    {
      id: 104,
      slug: "butterfly-collection",
      name: "Butterflies Collection",
      category: "Butterfly",
      collections: ["Mother's Day"],
      description: "A colourful collection of handmade butterfly designs.",
      basePriceCents: 2200,
      basePrice: 2200,
      imageUrl: "etsy/images-branded/butterflies-collection-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/butterflies-collection-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/butterflies-collection-approved-master.jpg",
      previewPattern: previewPatterns.butterfly,
      defaultColours: ["purple", "pink", "gold"],
      active: true,
      sortOrder: 124
    },
    {
      id: 105,
      slug: "baby-gecko",
      name: "Baby Gecko Keychain",
      category: "Tiny Garden Friends",
      description: "A small dark-blue handmade baby gecko keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/baby-gecko-tiny-garden-branded.png",
      referenceImageUrl: "etsy/images-branded/baby-gecko-tiny-garden-branded.png",
      previewImageUrl: "etsy/images-branded/baby-gecko-tiny-garden-branded.png",
      previewPattern: previewPatterns.babyGecko,
      defaultColours: ["blue", "black", "white"],
      active: true,
      sortOrder: 125
    },
    {
      id: 42,
      slug: "monkey",
      name: "Monkey",
      category: "Animals",
      description: "A personalized handmade beaded monkey keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/monkey-master.jpg",
      referenceImageUrl: "etsy/images-branded/monkey-master.jpg",
      previewImageUrl: "etsy/images-branded/monkey-master.jpg",
      previewPattern: previewPatterns.monkey,
      defaultColours: ["brown", "tan", "black", "red"],
      active: true,
      sortOrder: 126
    },
    {
      id: 134,
      slug: "lion",
      name: "Lion",
      category: "Animals",
      collections: ["Safari"],
      description: "A warm orange-and-yellow handmade beaded lion keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/lion-safari-owner-approved.jpg",
      referenceImageUrl: "etsy/images-branded/lion-safari-owner-approved.jpg",
      previewImageUrl: "etsy/images-branded/lion-safari-owner-approved.jpg",
      previewPattern: previewPatterns.lion,
      defaultColours: ["orange", "yellow", "red", "white"],
      active: true,
      sortOrder: 126.1
    },
    {
      id: 135,
      slug: "zebra",
      name: "Zebra",
      category: "Animals",
      collections: ["Safari"],
      description: "A classic black-and-white handmade beaded zebra keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/zebra-safari-owner-approved.jpg",
      referenceImageUrl: "etsy/images-branded/zebra-safari-owner-approved.jpg",
      previewImageUrl: "etsy/images-branded/zebra-safari-owner-approved.jpg",
      previewPattern: previewPatterns.zebra,
      defaultColours: ["black", "white", "white"],
      active: true,
      sortOrder: 126.2
    },
    {
      id: 115,
      slug: "magical-mane-unicorn",
      name: "Magical Mane Unicorn",
      category: "Enchanted Beings",
      description: "A personalized handmade beaded unicorn with a colourful magical mane.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "etsy/images-branded/magical-mane-unicorn-master.png",
      referenceImageUrl: "etsy/images-branded/magical-mane-unicorn-master.png",
      previewImageUrl: "etsy/images-branded/magical-mane-unicorn-master.png",
      previewPattern: previewPatterns.unicorn,
      defaultColours: ["white", "pink", "purple", "blue", "red"],
      active: true,
      sortOrder: 129.25
    },
    {
      id: 116,
      slug: "panda",
      name: "Panda",
      category: "Animals",
      description: "A handmade beaded panda keychain with a bright bamboo detail.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/panda-master.png",
      referenceImageUrl: "etsy/images-branded/panda-master.png",
      previewImageUrl: "etsy/images-branded/panda-master.png",
      previewPattern: previewPatterns.panda,
      defaultColours: ["black", "white", "pink", "blue", "green"],
      active: true,
      sortOrder: 126.5
    },
    {
      id: 117,
      slug: "rocket",
      name: "Rocket",
      category: "Outer Space",
      description: "A personalized handmade beaded rocket keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/rocket-master.jpg",
      referenceImageUrl: "etsy/images-branded/rocket-master.jpg",
      previewImageUrl: "etsy/images-branded/rocket-master.jpg",
      previewPattern: previewPatterns.rocket,
      defaultColours: ["blue", "light blue", "red", "orange", "yellow"],
      active: true,
      sortOrder: 129.4
    },
    {
      id: 107,
      slug: "canada-flag",
      name: "Canada Flag",
      category: "Flags",
      description: "A handmade Canada flag design.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/canada-flag-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/canada-flag-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/canada-flag-approved-master.jpg",
      previewPattern: previewPatterns.canadaFlag,
      defaultColours: ["red", "white"],
      active: true,
      sortOrder: 127
    },
    {
      id: 109,
      slug: "giraffe",
      name: "Giraffe",
      category: "Animals",
      description: "A personalized handmade beaded giraffe keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/giraffe-etsy-branded.jpg",
      referenceImageUrl: "etsy/images-branded/giraffe-etsy-branded.jpg",
      previewImageUrl: "etsy/images-branded/giraffe-etsy-branded.jpg",
      previewPattern: previewPatterns.giraffe,
      defaultColours: ["yellow", "orange", "brown", "black"],
      active: true,
      sortOrder: 129
    },
    {
      id: 110,
      slug: "ariel",
      name: "Ariel Keychain",
      category: "Enchanted Beings",
      description: "A handmade beaded mermaid keychain inspired by an undersea fairytale.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/ariel-keychain-master.png",
      referenceImageUrl: "etsy/images-branded/ariel-keychain-master.png",
      previewImageUrl: "etsy/images-branded/ariel-keychain-master.png",
      previewPattern: previewPatterns.mermaid,
      defaultColours: ["red", "cream", "purple", "green"],
      active: true,
      sortOrder: 129.5
    },
    {
      id: 111,
      slug: "palm-tree",
      name: "Palm Tree",
      category: "Sandy Beaches",
      description: "A handmade beaded palm tree inspired by warm sandy shores.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "etsy/images-branded/palm-tree-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/palm-tree-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/palm-tree-approved-master.jpg",
      previewPattern: previewPatterns.palmTree,
      defaultColours: ["green", "brown"],
      active: true,
      sortOrder: 129.7
    },
    {
      id: 114,
      slug: "pumpkin-spice-latte",
      name: "Pumpkin Spice Latte",
      category: "Monthly Exclusives",
      description: "September Exclusive Pumpkin Spice Latte keychain.",
      basePriceCents: 4500,
      basePrice: 4500,
      imageUrl: "etsy/images-branded/pumpkin-spice-latte-etsy-branded.jpg",
      referenceImageUrl: "etsy/images-branded/pumpkin-spice-latte-etsy-branded.jpg",
      previewImageUrl: "etsy/images-branded/pumpkin-spice-latte-etsy-branded.jpg",
      previewPattern: previewPatterns.pumpkinLatte,
      defaultColours: ["brown", "cream", "orange", "green"],
      active: true,
      sortOrder: 129.9
    },
    {
      id: 125,
      slug: "varsity-stripe-personalized-keychain",
      name: "Varsity Stripe Personalized Keychain",
      category: "Father's Day",
      description: "A personalized black, grey, blue and white pony-bead keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/varsity-stripe-personalized-keychain.jpg",
      referenceImageUrl: "images/varsity-stripe-personalized-keychain.jpg",
      previewImageUrl: "images/varsity-stripe-personalized-keychain.jpg",
      previewPattern: previewPatterns.stripeKeychain,
      defaultColours: ["black", "grey", "blue", "white"],
      active: true,
      sortOrder: 129.7
    },
    {
      id: 126,
      slug: "melting-ice-cream",
      name: "Melting Ice Cream",
      category: "Sweet Treats",
      description: "A personalized melting ice-cream pony-bead keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/melting-ice-cream.jpg",
      referenceImageUrl: "images/melting-ice-cream.jpg",
      previewImageUrl: "images/melting-ice-cream.jpg",
      previewPattern: previewPatterns.meltingIceCream,
      defaultColours: ["blue", "white", "brown", "tan"],
      active: true,
      sortOrder: 129.8
    },
    {
      id: 127,
      slug: "puppy",
      name: "Puppy",
      category: "Animals",
      description: "A handmade puppy keychain with optional name personalization.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/puppy-no-name.jpg",
      referenceImageUrl: "images/puppy-personalized-ezra.jpg",
      previewImageUrl: "images/puppy-no-name.jpg",
      previewPattern: previewPatterns.puppy,
      defaultColours: ["brown", "tan", "pink", "blue", "black"],
      active: true,
      sortOrder: 129.81
    },
    {
      id: 128,
      slug: "volleyball",
      name: "Volleyball",
      category: "Sports",
      description: "A personalized handmade volleyball keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/volleyball-personalized-kevin.jpg",
      referenceImageUrl: "images/volleyball-personalized-kevin.jpg",
      previewImageUrl: "images/volleyball-personalized-kevin.jpg",
      previewPattern: previewPatterns.volleyball,
      defaultColours: ["white", "grey", "blue"],
      active: true,
      sortOrder: 129.82
    },
    {
      id: 129,
      slug: "car",
      name: "Car",
      category: "Father's Day",
      description: "A personalized handmade blue car keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/car-personalized-ron.jpg",
      referenceImageUrl: "images/car-personalized-ron.jpg",
      previewImageUrl: "images/car-personalized-ron.jpg",
      previewPattern: previewPatterns.car,
      defaultColours: ["blue", "white", "black", "grey"],
      active: true,
      sortOrder: 129.83
    },
    {
      id: 130,
      slug: "rainbow-name-keychain",
      name: "Rainbow Name Keychain",
      category: "Mother's Day",
      collections: ["Mother's Day"],
      description: "A long rainbow pony-bead keychain personalized with a custom name.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/mothers-day-rainbow-name-keychain.jpg",
      referenceImageUrl: "images/mothers-day-rainbow-name-keychain.jpg",
      previewImageUrl: "images/mothers-day-rainbow-name-keychain.jpg",
      previewPattern: previewPatterns.rainbowName,
      defaultColours: ["red", "orange", "yellow", "pink", "purple"],
      active: true,
      sortOrder: 129.84
    },
    {
      id: 131,
      slug: "butterfly-name-keychain",
      name: "Butterfly Name Keychain",
      category: "Mother's Day",
      collections: ["Mother's Day", "Butterfly"],
      description: "A colourful pony-bead butterfly keychain personalized with a custom name.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/mothers-day-butterfly-name-keychain.jpg",
      referenceImageUrl: "images/mothers-day-butterfly-name-keychain.jpg",
      previewImageUrl: "images/mothers-day-butterfly-name-keychain.jpg",
      previewPattern: previewPatterns.butterfly,
      defaultColours: ["pink", "purple", "blue", "white"],
      active: true,
      sortOrder: 129.85
    },
    {
      id: 132,
      slug: "pastel-flower-bar-keychain",
      name: "Pastel Flower Bar Keychain",
      category: "Mother's Day",
      collections: ["Mother's Day", "Flower"],
      description: "A pink and green pastel pony-bead flower-bar keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/mothers-day-pastel-flower-bar-keychain.jpg",
      referenceImageUrl: "images/mothers-day-pastel-flower-bar-keychain.jpg",
      previewImageUrl: "images/mothers-day-pastel-flower-bar-keychain.jpg",
      previewPattern: previewPatterns.flowerBar,
      defaultColours: ["pink", "green", "cream"],
      active: true,
      sortOrder: 129.86
    },
    {
      id: 133,
      slug: "blue-flower-keychain",
      name: "Blue Flower Keychain",
      category: "Mother's Day",
      collections: ["Mother's Day", "Flower"],
      description: "A large blue, turquoise and green pony-bead flower keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/mothers-day-blue-flower-keychain.jpg",
      referenceImageUrl: "images/mothers-day-blue-flower-keychain.jpg",
      previewImageUrl: "images/mothers-day-blue-flower-keychain.jpg",
      previewPattern: previewPatterns.bigFlower,
      defaultColours: ["blue", "turquoise", "green"],
      active: true,
      sortOrder: 129.87
    },
    {
      id: 137,
      slug: "flower-braided",
      name: "Flower Braided",
      category: "Mother's Day",
      collections: ["Flower", "Mother's Day"],
      description: "A delicate braided flower design.",
      basePriceCents: 1800,
      basePrice: 1800,
      imageUrl: "etsy/images-branded/flower-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/flower-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/flower-owner-approved-master.jpg",
      previewPattern: previewPatterns.flower,
      defaultColours: ["pink", "purple", "white"],
      active: true,
      sortOrder: 129.88
    },
    {
      id: 138,
      slug: "intricated-flower",
      name: "Intricated Flower",
      category: "Mother's Day",
      collections: ["Flower", "Mother's Day"],
      description: "An intricate handmade flower for detail lovers.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/deluxe-flower-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/deluxe-flower-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/deluxe-flower-owner-approved-master.jpg",
      previewPattern: previewPatterns.flower,
      defaultColours: ["pink", "purple", "white"],
      active: true,
      sortOrder: 129.89
    },
    {
      id: 139,
      slug: "butterfly-and-flower",
      name: "Butterfly and Flower",
      category: "Mother's Day",
      collections: ["Butterfly", "Mother's Day"],
      description: "A detailed combination of butterfly and flower designs.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "etsy/images-branded/phoenix-butterfly-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/phoenix-butterfly-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/phoenix-butterfly-owner-approved-master.jpg",
      previewPattern: previewPatterns.butterflyWithFlowers,
      defaultColours: ["pink", "purple", "green", "white"],
      active: true,
      sortOrder: 129.9
    },
    {
      id: 140,
      slug: "apple",
      name: "Apple",
      category: "Back to School",
      description: "A handmade beaded apple keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/apple.jpeg",
      referenceImageUrl: "images/back-to-school/apple.jpeg",
      previewImageUrl: "images/back-to-school/apple.jpeg",
      previewPattern: previewPatterns.apple,
      defaultColours: ["red", "green", "brown"],
      previewColourParts: ["Leaf", "Stem"],
      previewPartDefaults: { "Leaf": "Green", "Stem": "Brown" },
      previewFixedColours: { d: "White" },
      previewSupportsAccent: false,
      active: true,
      sortOrder: 140
    },
    {
      id: 141,
      slug: "abc-blocks",
      name: "ABC Blocks",
      category: "Back to School",
      description: "A colourful handmade ABC Blocks keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/abc-blocks.jpeg",
      referenceImageUrl: "images/back-to-school/abc-blocks.jpeg",
      previewImageUrl: "images/back-to-school/abc-blocks.jpeg",
      previewPattern: previewPatterns.canadaFlag,
      defaultColours: ["red", "yellow", "blue"],
      active: true,
      sortOrder: 141
    },
    {
      id: 142,
      slug: "backpack",
      name: "Backpack",
      category: "Back to School",
      description: "A handmade beaded backpack keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/backpack.jpeg",
      referenceImageUrl: "images/back-to-school/backpack.jpeg",
      previewImageUrl: "images/back-to-school/backpack.jpeg",
      previewPattern: previewPatterns.panda,
      defaultColours: ["purple", "pink", "white"],
      active: true,
      sortOrder: 142
    },
    {
      id: 143,
      slug: "school-bus",
      name: "School Bus",
      category: "Back to School",
      description: "A handmade beaded school bus keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/school-bus.jpeg",
      referenceImageUrl: "images/back-to-school/school-bus.jpeg",
      previewImageUrl: "images/back-to-school/school-bus.jpeg",
      previewPattern: previewPatterns.car,
      defaultColours: ["yellow", "black", "white"],
      active: true,
      sortOrder: 143
    },
    {
      id: 144,
      slug: "ruler",
      name: "Ruler",
      category: "Back to School",
      description: "A handmade beaded ruler keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/ruler.jpeg",
      referenceImageUrl: "images/back-to-school/ruler.jpeg",
      previewImageUrl: "images/back-to-school/ruler.jpeg",
      previewPattern: previewPatterns.pencil,
      defaultColours: ["yellow", "black", "white"],
      active: true,
      sortOrder: 144
    },
    {
      id: 145,
      slug: "calculator",
      name: "Calculator",
      category: "Back to School",
      description: "A handmade beaded calculator keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/calculator.jpeg",
      referenceImageUrl: "images/back-to-school/calculator.jpeg",
      previewImageUrl: "images/back-to-school/calculator.jpeg",
      previewPattern: previewPatterns.canadaFlag,
      defaultColours: ["black", "white", "blue"],
      active: true,
      sortOrder: 145
    },
    {
      id: 146,
      slug: "glue-bottle",
      name: "Glue Bottle",
      category: "Back to School",
      description: "A handmade beaded glue bottle keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/glue-bottle-etsy-branded.jpg",
      referenceImageUrl: "etsy/images-branded/glue-bottle-etsy-branded.jpg",
      previewImageUrl: "etsy/images-branded/glue-bottle-etsy-branded.jpg",
      previewPattern: previewPatterns.pencil,
      defaultColours: ["white", "orange", "blue"],
      active: true,
      sortOrder: 146
    },
    {
      id: 147,
      slug: "scissors",
      name: "Scissors",
      category: "Back to School",
      description: "A handmade beaded scissors keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/scissors.jpeg",
      referenceImageUrl: "images/back-to-school/scissors.jpeg",
      previewImageUrl: "images/back-to-school/scissors.jpeg",
      previewPattern: previewPatterns.dragonfly,
      defaultColours: ["silver", "purple", "black"],
      active: true,
      sortOrder: 147
    },
    {
      id: 148,
      slug: "lunch-box",
      name: "Lunch Box",
      category: "Back to School",
      description: "A handmade beaded lunch box keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/lunch-box.jpeg",
      referenceImageUrl: "images/back-to-school/lunch-box.jpeg",
      previewImageUrl: "images/back-to-school/lunch-box.jpeg",
      previewPattern: previewPatterns.canadaFlag,
      defaultColours: ["pink", "purple", "white"],
      active: true,
      sortOrder: 148
    },
    {
      id: 149,
      slug: "stack-of-books",
      name: "Stack of Books",
      category: "Back to School",
      description: "A colourful handmade stack of books keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/back-to-school/stack-of-books.jpeg",
      referenceImageUrl: "images/back-to-school/stack-of-books.jpeg",
      previewImageUrl: "images/back-to-school/stack-of-books.jpeg",
      previewPattern: previewPatterns.stripeKeychain,
      defaultColours: ["red", "blue", "yellow"],
      active: true,
      sortOrder: 149
    },
    {
      id: 150,
      slug: "owl",
      name: "Owl",
      category: "Birds",
      collections: ["Fall Collection"],
      description: "A personalized handmade owl keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/owl-etsy-branded.jpg",
      referenceImageUrl: "etsy/images-branded/owl-etsy-branded.jpg",
      previewImageUrl: "etsy/images-branded/owl-etsy-branded.jpg",
      previewPattern: previewPatterns.penguin,
      defaultColours: ["brown", "cream", "gold"],
      active: true,
      sortOrder: 150
    },
    {
      id: 151,
      slug: "personalized-faith-heart-keychain",
      name: "Personalized Faith Heart Keychain",
      category: "Faith",
      description: "A personalized handmade faith heart keychain.",
      basePriceCents: 3000,
      basePrice: 3000,
      imageUrl: "etsy/images-branded/personalized-faith-heart-keychain-approved.jpg",
      referenceImageUrl: "etsy/images-branded/personalized-faith-heart-keychain-approved.jpg",
      previewImageUrl: "etsy/images-branded/personalized-faith-heart-keychain-approved.jpg",
      previewPattern: previewPatterns.loveHeart,
      defaultColours: ["purple", "white", "gold"],
      active: true,
      sortOrder: 151
    },
    {
      id: 152,
      slug: "fall-fox",
      name: "Fox",
      category: "Fall Collection",
      collections: ["Fall Collection", "Animals"],
      description: "A personalized handmade fox keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/fall-collection/fox.jpg",
      referenceImageUrl: "images/fall-collection/fox.jpg",
      previewImageUrl: "images/fall-collection/fox.jpg",
      previewPattern: previewPatterns.puppy,
      defaultColours: ["orange", "white", "black"],
      active: true,
      sortOrder: 152
    },
    {
      id: 153,
      slug: "fall-acorn",
      name: "Acorn",
      category: "Fall Collection",
      collections: ["Fall Collection"],
      description: "A handmade beaded acorn keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/acorn.jpg",
      referenceImageUrl: "images/october-collection/acorn.jpg",
      previewImageUrl: "images/october-collection/acorn.jpg",
      previewPattern: previewPatterns.acorn,
      defaultColours: ["brown", "tan", "cream"],
      active: true,
      sortOrder: 153
    },
    {
      id: 154,
      slug: "fall-maple-leaf",
      name: "Maple Leaf",
      category: "Fall Collection",
      description: "A handmade beaded maple leaf keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/fall-collection/maple-leaf.jpg",
      referenceImageUrl: "images/fall-collection/maple-leaf.jpg",
      previewImageUrl: "images/fall-collection/maple-leaf.jpg",
      previewPattern: previewPatterns.flower,
      defaultColours: ["red", "orange", "yellow"],
      active: true,
      sortOrder: 154
    },
    {
      id: 155,
      slug: "fall-sunflower",
      name: "Sunflower",
      category: "Fall Collection",
      description: "A handmade sunflower keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/sunflower-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/sunflower-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/sunflower-owner-approved-master.jpg",
      previewPattern: previewPatterns.flower,
      defaultColours: ["yellow", "brown", "green"],
      active: true,
      sortOrder: 155
    },
    {
      id: 156,
      slug: "fall-coffee-cup",
      name: "Coffee Cup",
      category: "Fall Collection",
      description: "A personalized handmade coffee cup keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/fall-collection/coffee-cup.jpg",
      referenceImageUrl: "images/fall-collection/coffee-cup.jpg",
      previewImageUrl: "images/fall-collection/coffee-cup.jpg",
      previewPattern: previewPatterns.pumpkinLatte,
      defaultColours: ["brown", "cream", "orange"],
      active: true,
      sortOrder: 156
    },
    {
      id: 157,
      slug: "fall-leaves-keychain",
      name: "Fall Leaves Keychain",
      category: "Fall Collection",
      description: "A handmade beaded autumn leaf keychain in red, orange, yellow and brown.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/fall-leaves-keychain-owner-approved-master.jpg",
      referenceImageUrl: "etsy/images-branded/fall-leaves-keychain-owner-approved-master.jpg",
      previewImageUrl: "etsy/images-branded/fall-leaves-keychain-owner-approved-master.jpg",
      previewPattern: previewPatterns.flower,
      defaultColours: ["red", "orange", "yellow", "brown"],
      active: true,
      sortOrder: 157
    },
    {
      id: 158,
      slug: "spider-man",
      name: "Spider-Man",
      category: "Superhero Collection",
      description: "A handmade beaded Spider-Man keychain.",
      basePriceCents: 4000,
      basePrice: 4000,
      imageUrl: "images/spider-man-and-captain-america-keychains.jpg",
      referenceImageUrl: "images/spider-man-and-captain-america-keychains.jpg",
      previewImageUrl: "images/spider-man-and-captain-america-keychains.jpg",
      previewPattern: previewPatterns.panda,
      defaultColours: ["red", "blue", "black"],
      active: true,
      sortOrder: 158
    },
    {
      id: 159,
      slug: "spider-man-version-1",
      name: "Spider-Man Version 1.0",
      category: "Superhero Collection",
      description: "A handmade beaded Spider-Man Version 1.0 keychain.",
      basePriceCents: 4000,
      basePrice: 4000,
      imageUrl: "images/spider-man-double-keychain.jpg",
      referenceImageUrl: "images/spider-man-double-keychain.jpg",
      previewImageUrl: "images/spider-man-double-keychain.jpg",
      previewPattern: previewPatterns.panda,
      defaultColours: ["red", "blue", "black"],
      active: true,
      sortOrder: 159
    },
    {
      id: 160,
      slug: "autumn-tree",
      name: "Autumn Tree",
      category: "Monthly Exclusives",
      collections: ["Fall Collection"],
      description: "October Exclusive handmade beaded autumn tree keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/october-collection/autumn-tree.jpg",
      referenceImageUrl: "images/october-collection/autumn-tree.jpg",
      previewImageUrl: "images/october-collection/autumn-tree.jpg",
      previewPattern: previewPatterns.autumnTree,
      defaultColours: ["orange", "red", "yellow", "brown"],
      active: true,
      sortOrder: 160
    },
    {
      id: 161,
      slug: "cinnamon-roll",
      name: "Cinnamon Roll",
      category: "Fall Collection",
      collections: ["Fall Collection", "Sweet Treats"],
      description: "A cozy handmade beaded cinnamon roll keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/cinnamon-roll.jpg",
      referenceImageUrl: "images/october-collection/cinnamon-roll.jpg",
      previewImageUrl: "images/october-collection/cinnamon-roll.jpg",
      previewPattern: previewPatterns.cinnamonRoll,
      defaultColours: ["brown", "white", "tan"],
      active: true,
      sortOrder: 161
    },
    {
      id: 162,
      slug: "pie-slice",
      name: "Pie Slice",
      category: "Fall Collection",
      collections: ["Fall Collection", "Sweet Treats"],
      description: "A cozy handmade beaded pie slice keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/pie-slice.jpg",
      referenceImageUrl: "images/october-collection/pie-slice.jpg",
      previewImageUrl: "images/october-collection/pie-slice.jpg",
      previewPattern: previewPatterns.pieSlice,
      defaultColours: ["brown", "tan", "white", "red"],
      active: true,
      sortOrder: 162
    },
    {
      id: 163,
      slug: "cozy-sweater",
      name: "Cozy Sweater",
      category: "Fall Collection",
      collections: ["Fall Collection"],
      description: "A cozy handmade beaded sweater keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/cozy-sweater.jpg",
      referenceImageUrl: "images/october-collection/cozy-sweater.jpg",
      previewImageUrl: "images/october-collection/cozy-sweater.jpg",
      previewPattern: previewPatterns.cozySweater,
      defaultColours: ["cream", "brown", "red", "orange"],
      active: true,
      sortOrder: 163
    },
    {
      id: 164,
      slug: "scarf",
      name: "Scarf",
      category: "Fall Collection",
      collections: ["Fall Collection"],
      description: "A cozy handmade beaded autumn scarf keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/scarf.jpg",
      referenceImageUrl: "images/october-collection/scarf.jpg",
      previewImageUrl: "images/october-collection/scarf.jpg",
      previewPattern: previewPatterns.scarf,
      defaultColours: ["red", "orange", "yellow", "brown"],
      active: true,
      sortOrder: 164
    },
    {
      id: 165,
      slug: "rain-boots",
      name: "Rain Boots",
      category: "Fall Collection",
      collections: ["Fall Collection"],
      description: "A cozy handmade beaded pair of rain boots.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/rain-boots.jpg",
      referenceImageUrl: "images/october-collection/rain-boots.jpg",
      previewImageUrl: "images/october-collection/rain-boots.jpg",
      previewPattern: previewPatterns.rainBoots,
      defaultColours: ["yellow", "brown", "white", "orange"],
      active: true,
      sortOrder: 165
    },
    {
      id: 166,
      slug: "umbrella",
      name: "Umbrella",
      category: "Fall Collection",
      collections: ["Fall Collection"],
      description: "A cozy handmade beaded autumn umbrella keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/umbrella.jpg",
      referenceImageUrl: "images/october-collection/umbrella.jpg",
      previewImageUrl: "images/october-collection/umbrella.jpg",
      previewPattern: previewPatterns.umbrella,
      defaultColours: ["red", "orange", "yellow", "black"],
      active: true,
      sortOrder: 166
    },
    {
      id: 167,
      slug: "hot-chocolate",
      name: "Hot Chocolate",
      category: "Fall Collection",
      collections: ["Fall Collection", "Sweet Treats"],
      description: "A cozy handmade beaded hot chocolate keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/hot-chocolate.jpg",
      referenceImageUrl: "images/october-collection/hot-chocolate.jpg",
      previewImageUrl: "images/october-collection/hot-chocolate.jpg",
      previewPattern: previewPatterns.hotChocolate,
      defaultColours: ["brown", "cream", "white", "tan"],
      active: true,
      sortOrder: 167
    },
    {
      id: 168,
      slug: "pinecone",
      name: "Pinecone",
      category: "Fall Collection",
      collections: ["Fall Collection"],
      description: "A cozy handmade beaded pinecone keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/pinecone.jpg",
      referenceImageUrl: "images/october-collection/pinecone.jpg",
      previewImageUrl: "images/october-collection/pinecone.jpg",
      previewPattern: previewPatterns.pinecone,
      defaultColours: ["brown", "tan", "green"],
      active: true,
      sortOrder: 168
    },
    {
      id: 169,
      slug: "squirrel",
      name: "Squirrel",
      category: "Fall Collection",
      collections: ["Fall Collection", "Animals"],
      description: "A cozy handmade beaded squirrel keychain.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/october-collection/squirrel.jpg",
      referenceImageUrl: "images/october-collection/squirrel.jpg",
      previewImageUrl: "images/october-collection/squirrel.jpg",
      previewPattern: previewPatterns.squirrel,
      defaultColours: ["brown", "tan", "black", "white"],
      active: true,
      sortOrder: 169
    },
    {
      id: 176,
      slug: "christmas-star",
      name: "Star",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Christmas star keychain, shown in six festive colour examples.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/star.jpg",
      referenceImageUrl: "images/christmas-collection/products/star.jpg",
      previewImageUrl: "images/christmas-collection/products/star.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/1-Photo-1.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["gold", "pearl", "white"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 176
    },
    {
      id: 177,
      slug: "poinsettia",
      name: "Poinsettia",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded poinsettia keychain with layered red petals, green leaves and a golden centre.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/christmas-collection/products/poinsettia.jpg",
      referenceImageUrl: "images/christmas-collection/products/poinsettia.jpg",
      previewImageUrl: "images/christmas-collection/products/poinsettia.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/2-Photo-2.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["red", "green", "gold", "brown"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 177
    },
    {
      id: 178,
      slug: "christmas-truck",
      name: "Christmas Truck",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded red Christmas truck keychain carrying a decorated tree.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "images/christmas-collection/products/christmas-truck.jpg",
      referenceImageUrl: "images/christmas-collection/products/christmas-truck.jpg",
      previewImageUrl: "images/christmas-collection/products/christmas-truck.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/3-Photo-3.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["red", "green", "gold", "black", "white", "silver"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 178
    },
    {
      id: 179,
      slug: "christmas-teddy-bear",
      name: "Teddy Bear",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded teddy bear keychain finished with a festive red bow.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/teddy-bear.jpg",
      referenceImageUrl: "images/christmas-collection/products/teddy-bear.jpg",
      previewImageUrl: "images/christmas-collection/products/teddy-bear.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/4-Photo-4.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["brown", "red", "cream", "black"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 179
    },
    {
      id: 180,
      slug: "christmas-polar-bear",
      name: "Polar Bear",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded polar bear keychain wearing a red hat and scarf.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/polar-bear.jpg",
      referenceImageUrl: "images/christmas-collection/products/polar-bear.jpg",
      previewImageUrl: "images/christmas-collection/products/polar-bear.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/5-Photo-5.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["white", "red", "black", "pink", "cream"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 180
    },
    {
      id: 181,
      slug: "gingerbread-girl",
      name: "Gingerbread Girl",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded gingerbread girl keychain with a red bow, heart and festive trim.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/gingerbread-girl.jpg",
      referenceImageUrl: "images/christmas-collection/products/gingerbread-girl.jpg",
      previewImageUrl: "images/christmas-collection/products/gingerbread-girl.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/6-Photo-6.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["brown", "red", "white", "pink", "black"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 181
    },
    {
      id: 182,
      slug: "christmas-wreath",
      name: "Wreath",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Christmas wreath keychain with a red bow and golden accents.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/wreath.jpg",
      referenceImageUrl: "images/christmas-collection/products/wreath.jpg",
      previewImageUrl: "images/christmas-collection/products/wreath.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/7-Photo-7.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["green", "red", "gold"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 182
    },
    {
      id: 183,
      slug: "christmas-candy-cane",
      name: "Candy Cane",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded candy cane keychain with a festive green and red bow.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/candy-cane.jpg",
      referenceImageUrl: "images/christmas-collection/products/candy-cane.jpg",
      previewImageUrl: "images/christmas-collection/products/candy-cane.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/8-Photo-8.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["red", "white", "green"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 183
    },
    {
      id: 184,
      slug: "christmas-present",
      name: "Present",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Christmas present keychain wrapped in red with a golden bow.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/present.jpg",
      referenceImageUrl: "images/christmas-collection/products/present.jpg",
      previewImageUrl: "images/christmas-collection/products/present.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/9-Photo-9.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["red", "gold"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 184
    },
    {
      id: 185,
      slug: "christmas-stocking",
      name: "Christmas Stocking",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded red Christmas stocking keychain with white trim and holly detail.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/christmas-stocking.jpg",
      referenceImageUrl: "images/christmas-collection/products/christmas-stocking.jpg",
      previewImageUrl: "images/christmas-collection/products/christmas-stocking.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/1-Photo-1.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["red", "white", "green"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 185
    },
    {
      id: 186,
      slug: "christmas-tree",
      name: "Christmas Tree",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Christmas tree keychain with festive ornaments and a star topper.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/christmas-tree.jpg",
      referenceImageUrl: "images/christmas-collection/products/christmas-tree.jpg",
      previewImageUrl: "images/christmas-collection/products/christmas-tree.jpg",
      additionalImageUrls: ["images/christmas-collection/products/christmas-tree-example-2.jpg"],
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/2-Photo-2.jpg",
      additionalOriginalSourceImageUrls: ["images/christmas-collection/originals/batch-2/6-Photo-6.jpg"],
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["green", "red", "white", "yellow", "brown"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 186
    },
    {
      id: 187,
      slug: "christmas-snowflake",
      name: "Snowflake",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded snowflake keychain with icy blue and pearl-style details.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/snowflake.jpg",
      referenceImageUrl: "images/christmas-collection/products/snowflake.jpg",
      previewImageUrl: "images/christmas-collection/products/snowflake.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/3-Photo-3.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["white", "blue", "pearl"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 187
    },
    {
      id: 188,
      slug: "gingerbread-man",
      name: "Gingerbread Man",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded gingerbread man keychain with a red bow and festive button details.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/gingerbread-man.jpg",
      referenceImageUrl: "images/christmas-collection/products/gingerbread-man.jpg",
      previewImageUrl: "images/christmas-collection/products/gingerbread-man.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/4-Photo-4.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["brown", "white", "red", "green", "black", "pink"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 188
    },
    {
      id: 189,
      slug: "christmas-angel",
      name: "Angel",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Christmas angel keychain with white wings, a blue dress and golden halo.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/angel.jpg",
      referenceImageUrl: "images/christmas-collection/products/angel.jpg",
      previewImageUrl: "images/christmas-collection/products/angel.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/5-Photo-5.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["blue", "white", "gold", "cream", "black", "pink"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 189
    },
    {
      id: 190,
      slug: "christmas-snowman",
      name: "Snowman",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded snowman keychain with a black hat, red scarf and branch arms.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/snowman.jpg",
      referenceImageUrl: "images/christmas-collection/products/snowman.jpg",
      previewImageUrl: "images/christmas-collection/products/snowman.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/7-Photo-7.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["white", "black", "red", "brown", "orange", "green"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 190
    },
    {
      id: 191,
      slug: "christmas-reindeer",
      name: "Reindeer",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Christmas reindeer keychain with dark antlers and a bright red nose.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/reindeer.jpg",
      referenceImageUrl: "images/christmas-collection/products/reindeer.jpg",
      previewImageUrl: "images/christmas-collection/products/reindeer.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/8-Photo-8.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["brown", "black", "white", "red", "cream"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 191
    },
    {
      id: 192,
      slug: "christmas-elf",
      name: "Elf",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Christmas elf keychain in festive green and red with a pointed hat.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/elf.jpg",
      referenceImageUrl: "images/christmas-collection/products/elf.jpg",
      previewImageUrl: "images/christmas-collection/products/elf.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/10-Photo-10.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["green", "red", "white", "black", "yellow", "cream", "pink"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 192
    },
    {
      id: 193,
      slug: "glow-in-the-dark-christmas-ornament",
      name: "Glow-in-the-Dark Christmas Ornament",
      category: "Christmas Collection",
      collections: ["Christmas Collection", "Monthly Exclusives"],
      description: "A handmade multicolour Christmas ornament made with naturally glowing beads that charge through exposure to light, with no batteries or LEDs.",
      basePriceCents: 3500,
      basePrice: 3500,
      imageUrl: "images/christmas-collection/products/glow-in-the-dark-christmas-ornament.jpg",
      referenceImageUrl: "images/christmas-collection/products/glow-in-the-dark-christmas-ornament.jpg",
      previewImageUrl: "images/christmas-collection/products/glow-in-the-dark-christmas-ornament.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-2/9-Photo-9.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      previewNote: "Naturally glowing beads charge after exposure to light and glow in darker surroundings. No batteries or LEDs are used; glow brightness and duration vary with light exposure.",
      defaultColours: ["green", "blue", "pink", "yellow", "pearl"],
      supportsPersonalization: false,
      exclusiveLabel: "November Exclusive — 2026",
      active: true,
      sortOrder: 193
    },
    {
      id: 194,
      slug: "mrs-claus",
      name: "Mrs. Claus",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Mrs. Claus keychain in festive red with white trim and a golden belt buckle.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/mrs-claus.jpg",
      referenceImageUrl: "images/christmas-collection/products/mrs-claus.jpg",
      previewImageUrl: "images/christmas-collection/products/mrs-claus.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-3/1-Photo-1.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["red", "white", "cream", "black", "pink", "gold"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 194
    },
    {
      id: 195,
      slug: "christmas-santa",
      name: "Santa",
      category: "Christmas Collection",
      collections: ["Christmas Collection"],
      description: "A handmade beaded Santa keychain in a classic red suit with white trim and black boots.",
      basePriceCents: 2000,
      basePrice: 2000,
      imageUrl: "images/christmas-collection/products/santa.jpg",
      referenceImageUrl: "images/christmas-collection/products/santa.jpg",
      previewImageUrl: "images/christmas-collection/products/santa.jpg",
      originalSourceImageUrl: "images/christmas-collection/originals/batch-3/2-Photo-2.jpg",
      imageClassification: "styled-marketing-photo",
      previewPattern: null,
      defaultColours: ["red", "white", "cream", "black", "yellow"],
      supportsPersonalization: false,
      active: true,
      sortOrder: 195
    },
    {
      id: 18,
      slug: "ice-cream-keychain",
      name: "Ice Cream Keychain",
      category: "Sweet Treats",
      description: "A handmade beaded ice cream keychain.",
      basePriceCents: 2500,
      basePrice: 2500,
      imageUrl: "etsy/images-branded/ice-cream-keychain-etsy-branded.jpg",
      referenceImageUrl: "etsy/images-branded/ice-cream-keychain-etsy-branded.jpg",
      previewImageUrl: "etsy/images-branded/ice-cream-keychain-etsy-branded.jpg",
      previewPattern: previewPatterns.iceCream,
      defaultColours: ["pink", "cream", "gold"],
      active: true,
      disabledReason: "",
      sortOrder: 130
    }
  ];

  const ownerCorrectionSlugs = new Set([
    "tiger", "monkey", "panda", "giraffe", "puppy", "owl", "fall-fox", "squirrel", "lion", "zebra",
    "abc-blocks", "backpack", "calculator", "glue-bottle", "scissors", "stack-of-books",
    "personalized-butterfly-keychain", "butterfly-and-flower", "butterfly-collection", "butterfly-name-keychain",
    "christmas-star", "poinsettia", "christmas-truck", "christmas-teddy-bear", "christmas-polar-bear",
    "gingerbread-girl", "christmas-candy-cane", "christmas-tree", "christmas-snowflake", "gingerbread-man",
    "christmas-angel", "christmas-snowman", "christmas-reindeer", "christmas-elf", "mrs-claus", "christmas-santa",
    "unicorn", "magical-mane-unicorn", "ariel",
    "fall-maple-leaf", "fall-sunflower", "fall-coffee-cup", "fall-leaves-keychain", "autumn-tree", "scarf",
    "hot-chocolate", "pumpkin-spice-latte",
    "deluxe-flower", "flower-braided", "big-flower", "pastel-flower-bar-keychain", "blue-flower-keychain",
    "rainbow-name-keychain",
    "turtle", "personalized-turtle-keychain", "whale", "lobster", "shark",
    "palm-tree", "ladybug-backpack"
  ]);

  const braceletSlugs = new Set([
    "best-friends-forever-bracelet",
    "unicorn-dreams-bracelet",
    "mermaid-wishes-bracelet",
    "sweetheart-bracelet",
    "pearl-glow-bracelet"
  ]);

  const productConstruction = (product) => {
    if (braceletSlugs.has(product.slug)) {
      return {
        productType: "bracelet",
        attachmentType: "elastic-bracelet",
        attachmentDescription: "Continuous stretch bracelet; no keychain hardware",
        hardwareOptions: [],
        requiresHardwareSelection: false
      };
    }
    if (product.slug === "flower-beaded-lanyard") {
      return {
        productType: "lanyard",
        attachmentType: "lanyard-clasp",
        attachmentDescription: "Silver-tone lanyard clasp",
        hardwareOptions: [],
        requiresHardwareSelection: false
      };
    }
    if (product.slug === "glow-in-the-dark-christmas-ornament") {
      return {
        productType: "ornament",
        attachmentType: "hanging-cord",
        attachmentDescription: "White hanging cord",
        hardwareOptions: [],
        requiresHardwareSelection: false
      };
    }
    if (product.slug === "custom-idea") {
      return {
        productType: "custom",
        attachmentType: "owner-confirmed",
        attachmentDescription: "Attachment confirmed after design review",
        hardwareOptions: ["Silver", "Gold"],
        requiresHardwareSelection: true
      };
    }
    return {
      productType: "keychain",
      attachmentType: "keyring-and-clasp",
      attachmentDescription: "Keyring and lobster clasp",
      hardwareOptions: ["Silver", "Gold"],
      requiresHardwareSelection: true
    };
  };

  const essentialOwnerClarificationSlugs = new Set([
    "butterfly-collection",
    "personalized-blossom-keychain",
    "personalized-scripture-dove-keychain",
    "spider-man",
    "spider-man-version-1",
    "glow-in-the-dark-christmas-ornament"
  ]);
  const elevatedVisualDifferenceSlugs = new Set([
    ...essentialOwnerClarificationSlugs,
    "personalized-butterfly-keychain",
    "personalized-blossom-keychain",
    "personalized-turtle-keychain",
    "butterfly-name-keychain",
    "fall-leaves-keychain",
    "christmas-truck",
    "poinsettia"
  ]);
  const insufficientPatternEvidenceSlugs = new Set([
    "butterfly-collection",
    "personalized-scripture-dove-keychain",
    "personalized-blossom-keychain",
    "spider-man",
    "spider-man-version-1",
    "glow-in-the-dark-christmas-ornament"
  ]);
  const needsVisualCorrectionReasons = Object.freeze({
    "natalies-butterfly": "Wing span, body length, and compact bead spacing do not yet match the approved butterfly photograph.",
    "butterfly": "Wing rows and the narrow central body need to be rebuilt from the approved compact butterfly construction.",
    "personalized-butterfly-keychain": "The approved design uses a compact butterfly above a vertical name strand; the current wide-wing proposal has the wrong construction.",
    "flower": "The flower head, stem, leaves, and dangling name strand need the photograph's visible row lengths and spacing.",
    "personalized-blossom-keychain": "The blossom, vertical name strand, heart accents, and two dangling strands cannot be established exactly from the single styled view.",
    "big-flower": "The proposal is a large diamond flower; the approved product is a smaller flower head with a long stem and leaves.",
    "deluxe-flower": "The proposal is a vertical flower bar; the approved product is a dense circular flower with different petal construction.",
    "butterfly-with-flowers": "The approved product is a slim flower-and-butterfly strand, not a full-width butterfly silhouette.",
    "macaw": "Head, beak, wing, body, feet, and long tail proportions need to follow the full bird in the approved photograph.",
    "fish": "Body direction, fins, eye placement, and tail construction do not match the approved fish.",
    "penguin": "The proposal reads as a rounded face; the approved product is a complete upright penguin with wings, body, and feet.",
    "turtle": "Shell, head, flippers, and tail proportions need to be rebuilt from the approved turtle photograph.",
    "personalized-turtle-keychain": "The turtle body and attached vertical personalization strand are not represented by the current shell-only proposal.",
    "whale": "The current silhouette does not preserve the approved whale's head, belly, flippers, and tail proportions.",
    "jellyfish": "The bell shape and individual dangling tentacles need the approved photograph's visible bead rows.",
    "lobster": "Claws, antennae, segmented body, and tail are too simplified to match the approved lobster.",
    "shark": "Snout, dorsal fin, belly, side fins, and tail proportions do not match the approved shark.",
    "personalized-scripture-dove-keychain": "The dove, carrot detail, and name strand are partly obscured; exact visible construction needs additional evidence.",
    "pencil": "The proposal is too wide and does not preserve the approved pencil's narrow shaft, eraser, and pointed tip.",
    "octopus": "The head and eight distinct curled tentacles are not represented accurately.",
    "best-friends-forever-bracelet": "The shared ring proposal omits this bracelet's exact letter-bead sequence and colour placement.",
    "unicorn-dreams-bracelet": "The shared ring proposal omits this bracelet's exact letter-bead sequence and colour placement.",
    "mermaid-wishes-bracelet": "The shared ring proposal omits this bracelet's exact letter-bead sequence and colour placement.",
    "sweetheart-bracelet": "The shared ring proposal omits this bracelet's exact letter-bead sequence and colour placement.",
    "pearl-glow-bracelet": "The shared ring proposal does not reproduce this bracelet's pearl spacing and accent sequence.",
    "personalized-love-heart-keychain": "The heart outline, interior name beads, and hanging construction need the approved photograph's exact visible layout.",
    "flower-beaded-lanyard": "The long lanyard loop, repeated flower spacing, and clasp ends are too simplified.",
    "tiger": "The approved product is a full-limbed tiger; the current block face/body proposal loses its legs, ears, and proportions.",
    "ladybug-backpack": "The approved product is a tall ladybug keychain; the proposal incorrectly uses a round body.",
    "unicorn": "The approved product is a complete standing unicorn; the proposal is a small head-like silhouette.",
    "baby-gecko": "Head, torso, four limbs, feet, and long tail proportions do not match the approved gecko.",
    "monkey": "The approved product is a full monkey with head, torso, four limbs, hands, feet, and tail; the proposal is not that construction.",
    "lion": "Mane, face, torso, legs, paws, and tail need to be rebuilt as the complete approved lion.",
    "zebra": "The full-body direction is recognizable, but leg, muzzle, mane, and stripe placement remain visibly different.",
    "magical-mane-unicorn": "The approved product is a complete standing unicorn; the proposal is a small head-like silhouette.",
    "panda": "The proposal is a large square face; the approved product is a tall full-body panda with arms and legs.",
    "giraffe": "The proposal omits the approved giraffe's complete head, neck, torso, four legs, and tail construction.",
    "ariel": "Head, hair, torso, arms, and mermaid tail need to follow the approved character-specific bead arrangement.",
    "pumpkin-spice-latte": "The approved product is a tall handled cup with foam and personalization; the proposal is a rounded badge.",
    "varsity-stripe-personalized-keychain": "The long stripe bar is recognizable, but the central letter beads and end construction are missing.",
    "melting-ice-cream": "The proposal does not preserve the approved melting scoop, drips, cone, and hanging orientation.",
    "puppy": "The approved product is a complete puppy with head, body, legs, paws, and ears; the proposal uses an unrelated compact silhouette.",
    "rainbow-name-keychain": "The approved product is a long vertical personalized strand; the proposal incorrectly uses a rainbow arc.",
    "butterfly-name-keychain": "The approved design is a compact butterfly with an attached name strand; the current proposal has the wrong scale and arrangement.",
    "pastel-flower-bar-keychain": "The flower clusters and narrow vertical bar need the approved photograph's exact spacing and row lengths.",
    "blue-flower-keychain": "The approved flower head, leaves, and stem are not represented by the oversized diamond proposal.",
    "flower-braided": "The approved braided flower strand has a narrow construction that the wide flower proposal does not reproduce.",
    "intricated-flower": "The dense circular multicolour flower construction is not represented by the current wide oval proposal.",
    "butterfly-and-flower": "The small butterfly, flower, and connecting vertical strand need their own product-specific layout.",
    "apple": "The apple silhouette is recognizable, but the approved interior name beads, leaf, stem, and row spacing are not yet reproduced.",
    "abc-blocks": "The approved product has three separate hanging alphabet blocks; the proposal incorrectly forms one rectangular panel.",
    "backpack": "Pocket, straps, zipper rows, and personalized front panel do not match the approved backpack construction.",
    "glue-bottle": "Bottle shoulders, cap, label area, and narrow body proportions need the approved visible row structure.",
    "lunch-box": "Handle, rounded case, border, and personalized centre panel need the approved photograph's construction.",
    "personalized-faith-heart-keychain": "The approved heart includes interior letter beads and a different outline density than the current solid heart.",
    "fall-fox": "The approved product is a full fox with head, torso, legs, ears, tail, and personalization; the proposal is a face-like mask.",
    "fall-coffee-cup": "The handle, cup body, foam rim, and personalized centre need to match the approved photograph.",
    "christmas-polar-bear": "The approved product is a complete standing bear; the proposal is a rounded face/body panel without correct limbs.",
    "gingerbread-girl": "Dress, arms, legs, bow, icing, and body proportions need closer reconstruction from the approved photograph.",
    "christmas-teddy-bear": "The approved bear has distinct ears, arms, torso, legs, and bow; the proposal remains too block-like.",
    "mrs-claus": "The proposal shares Santa's geometry and does not reproduce Mrs. Claus's hair, dress, face, and body arrangement.",
    "ice-cream-keychain": "The approved product is a narrow cone with a tapered scoop; the proposal is too wide and round."
  });
  const previewAuditMaxProductId = 195;
  const catalogue = Object.freeze(products.map((product) => {
    const construction = productConstruction(product);
    const proposedPattern = provisionalPatternsBySlug[product.slug] || product.previewPattern;
    const provisionalLabels = provisionalPartLabelsBySlug[product.slug];
    const defaultColours = (product.defaultColours || []).map(colour => (
      String(colour || "").charAt(0).toUpperCase() + String(colour || "").slice(1).toLowerCase()
    ));
    const derivedPartLabels = provisionalLabels
      ? provisionalLabels.slice(0, Math.max(1, defaultColours.length - 2))
      : product.previewColourParts;
    const derivedPartDefaults = provisionalLabels
      ? Object.fromEntries(derivedPartLabels.map((label, index) => [label, defaultColours[index + 1] || defaultColours[0] || "Cream"]))
      : product.previewPartDefaults;
    const hasProposedPattern = Number(product.id) <= previewAuditMaxProductId
      && Array.isArray(proposedPattern)
      && proposedPattern.length > 0;
    const previewMode = product.slug === "custom-idea"
      ? "custom"
      : (hasProposedPattern ? "colour-responsive" : "reference");
    const previewAuditReason = previewMode === "reference"
      ? "missing-pattern"
      : "owner-approved-pattern";
    const requiresOwnerCorrection = ownerCorrectionSlugs.has(product.slug);
    const patternVerificationStatus = product.slug === "custom-idea" ? "not-applicable" : "verified";
    const correctionReason = needsVisualCorrectionReasons[product.slug] || "Owner identified this product for final pattern correction.";
    const visualAuditReason = requiresOwnerCorrection
      ? "Owner approved the corrected dimensional pattern during the complete 117-product visual review."
      : "Owner approved during the complete 117-product visual review; existing geometry is preserved.";
    const patternAccuracyStatus = product.slug === "custom-idea"
      ? "not-applicable"
      : (hasProposedPattern ? "accurate" : "missing");
    const customerPreviewMode = patternVerificationStatus === "verified" && hasProposedPattern
      ? "colour-responsive"
      : "reference";
    return Object.freeze({
      ...product,
      ...construction,
      previewPattern: proposedPattern,
      previewRendererKind: construction.productType === "bracelet"
        ? "bracelet-construction"
        : (Number(product.id) === 174 ? "frog-construction" : "bead-grid"),
      previewColourParts: derivedPartLabels,
      previewPartDefaults: derivedPartDefaults,
      previewAccentDefault: provisionalLabels
        ? (defaultColours.at(-1) || product.previewAccentDefault)
        : product.previewAccentDefault,
      previewMode,
      previewAuditReason,
      patternVerificationStatus,
      patternProposalAvailable: hasProposedPattern,
      patternEvidence: hasProposedPattern ? "proposed-pattern-and-approved-photo" : "approved-photo-only",
      patternAccuracyStatus,
      correctionReason,
      visualAuditReason,
      visualDifferenceRisk: requiresOwnerCorrection ? "high" : "standard",
      essentialOwnerClarification: false,
      ownerCorrectionRequired: requiresOwnerCorrection,
      ownerCorrectionApproved: requiresOwnerCorrection,
      customerPreviewMode
    });
  }));

  if (typeof module !== "undefined" && module.exports) {
    module.exports = catalogue;
  }

  if (root) {
    root.FOREVER_BEADED_PRODUCTS = catalogue;
  }
})(typeof window !== "undefined" ? window : globalThis);
