// apps/pdf-service/templates/schematic.typ
#let data = json(sys.inputs.at("data-path"))

#let symbol-svg(node-type) = {
  let mapping = (
    "RCD": "symbols/rcd.svg",
    "LS_SCHALTER": "symbols/ls.svg",
    "KLEMME": "symbols/klemme.svg",
    "VERBRAUCHER": "symbols/verbraucher.svg",
    "HAUPTSCHALTER": "symbols/hauptschalter.svg",
  )
  mapping.at(node-type, default: "symbols/generic.svg")
}

#let draw-busbars(busbars) = {
  for bar in busbars {
    place(
      dx: bar.xStart * 1mm, dy: bar.y * 1mm,
      line(length: (bar.xEnd - bar.xStart) * 1mm, stroke: 0.6pt + black)
    )
    place(dx: (bar.xStart - 8) * 1mm, dy: (bar.y - 2) * 1mm, text(size: 6pt)[#bar.phase])
  }
}

#let draw-block(block) = {
  place(
    dx: block.x * 1mm, dy: block.y * 1mm,
    box(width: block.width * 1mm, height: block.height * 1mm)[
      #image(symbol-svg(block.type), width: 100%)
      #place(bottom, text(size: 5pt)[#block.nodeId])
    ]
  )
  for child in block.children {
    draw-block(child)
  }
}

#let draw-cross-refs(refs, direction) = {
  for r in refs {
    let arrow = if direction == "out" { sym.arrow.r } else { sym.arrow.l }
    text(size: 7pt, fill: rgb("#b45309"))[#arrow #r.label]
  }
}

#for page in data.pages [
  #set page(width: 420mm, height: 297mm, margin: 15mm)

  #place(top + right, text(size: 8pt)[
    Seite #(page.pageIndex + 1) / #data.pages.len() — OpenCircuit
  ])

  #draw-busbars(page.busbars)
  #for block in page.blocks { draw-block(block) }

  #place(bottom + left, draw-cross-refs(page.crossRefsIn, "in"))
  #place(bottom + right, draw-cross-refs(page.crossRefsOut, "out"))

  #pagebreak(weak: true)
]
