import { decimalExactSemanticValue } from './numeric.mjs'

const escapeLatex=(value)=>String(value).replace(/\\/g,'\\textbackslash{}').replace(/([{}_#%&$])/g,'\\$1')
const escapeXml=(value)=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

function maps(mathObject) {
  const nodes=new Map(mathObject.expression.nodes.map((n)=>[n.id,n]))
  const decls=new Map((mathObject.environment?.declarations??[]).map((d)=>[d.declaration_id,d]))
  return {nodes,decls}
}
function opName(op) { return op?.name ?? 'operator' }

function latexRenderer(mathObject) {
  const {nodes,decls}=maps(mathObject)
  const render=(nodeId,bindings=new Map())=>{
    const n=nodes.get(nodeId); if(!n) throw new Error(`missing Native Math node ${nodeId}`)
    switch(n.kind) {
      case 'integer': return n.value
      case 'rational': return `\\frac{${n.numerator}}{${n.denominator}}`
      case 'decimal-exact': return decimalExactSemanticValue(n.coefficient,n.exponent10)
      case 'number-approx': return escapeLatex(n.value)
      case 'free-ref': return escapeLatex(decls.get(n.declaration_id)?.display_name ?? n.declaration_id)
      case 'bound-ref': return escapeLatex(bindings.get(n.binding_id) ?? n.binding_id)
      case 'apply': {
        const args=n.args.map((a)=>render(a,bindings)); const name=opName(n.operator)
        if (name==='power'&&args.length===2) return `${args[0]}^{${args[1]}}`
        if ((name==='plus'||name==='add')&&args.length>=2) return args.join(' + ')
        if ((name==='times'||name==='multiply')&&args.length>=2) return args.join(' \\cdot ')
        if ((name==='divide'||name==='quotient')&&args.length===2) return `\\frac{${args[0]}}{${args[1]}}`
        return `\\operatorname{${escapeLatex(name)}}\\left(${args.join(', ')}\\right)`
      }
      case 'binder': {
        const next=new Map(bindings); for(const b of n.bindings) next.set(b.binding_id,b.display_name||b.binding_id)
        const body=render(n.body,next); const name=opName(n.operator)
        if (name==='integral') {
          const lower=n.limits?.lower?render(n.limits.lower,bindings):''; const upper=n.limits?.upper?render(n.limits.upper,bindings):''
          const variable=escapeLatex(n.bindings[0]?.display_name ?? n.bindings[0]?.binding_id ?? 'x')
          return `\\int_{${lower}}^{${upper}} ${body}\\, d${variable}`
        }
        const vars=n.bindings.map((b)=>escapeLatex(b.display_name||b.binding_id)).join(',')
        return `\\operatorname{${escapeLatex(name)}}_{${vars}}\\left(${body}\\right)`
      }
      case 'sequence': return `\\left(${n.items.map((x)=>render(x,bindings)).join(', ')}\\right)`
      case 'matrix': return `\\begin{bmatrix}${n.cells.map((row)=>row.map((x)=>render(x,bindings)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`
      case 'piecewise': {
        const rows=n.cases.map((c)=>`${render(c.value,bindings)} & ${render(c.condition,bindings)}`)
        if(n.otherwise) rows.push(`${render(n.otherwise,bindings)} & \\text{otherwise}`)
        return `\\begin{cases}${rows.join(' \\\\ ')}\\end{cases}`
      }
      case 'quantity': return `${render(n.value,bindings)}\\,\\operatorname{${escapeLatex(opName(n.unit))}}`
      case 'external-ref': return `\\operatorname{external}`
      case 'hole': return `\\operatorname{${escapeLatex(n.status)}}`
      default: throw new Error(`unsupported Native Math node kind: ${n.kind}`)
    }
  }
  return render(mathObject.expression.root,new Map())
}

function mathmlRenderer(mathObject) {
  const {nodes,decls}=maps(mathObject)
  const render=(nodeId,bindings=new Map())=>{
    const n=nodes.get(nodeId); if(!n) throw new Error(`missing Native Math node ${nodeId}`)
    switch(n.kind) {
      case 'integer': return `<mn>${escapeXml(n.value)}</mn>`
      case 'rational': return `<mfrac><mn>${escapeXml(n.numerator)}</mn><mn>${escapeXml(n.denominator)}</mn></mfrac>`
      case 'decimal-exact': return `<mn>${escapeXml(decimalExactSemanticValue(n.coefficient,n.exponent10))}</mn>`
      case 'number-approx': return `<mn>${escapeXml(n.value)}</mn>`
      case 'free-ref': return `<mi>${escapeXml(decls.get(n.declaration_id)?.display_name ?? n.declaration_id)}</mi>`
      case 'bound-ref': return `<mi>${escapeXml(bindings.get(n.binding_id) ?? n.binding_id)}</mi>`
      case 'apply': {
        const args=n.args.map((a)=>render(a,bindings)); const name=opName(n.operator)
        if(name==='power'&&args.length===2) return `<msup>${args[0]}${args[1]}</msup>`
        if((name==='plus'||name==='add')&&args.length>=2) return `<mrow>${args.join('<mo>+</mo>')}</mrow>`
        if((name==='times'||name==='multiply')&&args.length>=2) return `<mrow>${args.join('<mo>×</mo>')}</mrow>`
        if((name==='divide'||name==='quotient')&&args.length===2) return `<mfrac>${args[0]}${args[1]}</mfrac>`
        return `<mrow><mi>${escapeXml(name)}</mi><mo>(</mo>${args.join('<mo>,</mo>')}<mo>)</mo></mrow>`
      }
      case 'binder': {
        const next=new Map(bindings); for(const b of n.bindings) next.set(b.binding_id,b.display_name||b.binding_id)
        const body=render(n.body,next); const name=opName(n.operator)
        if(name==='integral') {
          const lower=n.limits?.lower?render(n.limits.lower,bindings):'<mrow/>'; const upper=n.limits?.upper?render(n.limits.upper,bindings):'<mrow/>'
          const variable=escapeXml(n.bindings[0]?.display_name ?? n.bindings[0]?.binding_id ?? 'x')
          return `<mrow><munderover><mo>∫</mo>${lower}${upper}</munderover>${body}<mo>d</mo><mi>${variable}</mi></mrow>`
        }
        return `<mrow><mi>${escapeXml(name)}</mi><mo>(</mo>${body}<mo>)</mo></mrow>`
      }
      case 'sequence': return `<mfenced>${n.items.map((x)=>render(x,bindings)).join('<mo>,</mo>')}</mfenced>`
      case 'matrix': return `<mtable>${n.cells.map((row)=>`<mtr>${row.map((x)=>`<mtd>${render(x,bindings)}</mtd>`).join('')}</mtr>`).join('')}</mtable>`
      case 'piecewise': return `<mrow>${n.cases.map((c)=>`<mrow>${render(c.value,bindings)}<mo>if</mo>${render(c.condition,bindings)}</mrow>`).join('')}</mrow>`
      case 'quantity': return `<mrow>${render(n.value,bindings)}<mi>${escapeXml(opName(n.unit))}</mi></mrow>`
      case 'external-ref': return '<mi>external</mi>'
      case 'hole': return `<mi>${escapeXml(n.status)}</mi>`
      default: throw new Error(`unsupported Native Math node kind: ${n.kind}`)
    }
  }
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${render(mathObject.expression.root,new Map())}</math>`
}

function fidelity(adapter,overrides={}) { return { profile:'org.evemisslab.math-adapter-fidelity/0.1',record_type:'adapter-fidelity',adapter,semantics:'preserved-subset',binding:'preserved-subset',conditions:'preserved-subset',presentation:'approximated',provenance:'dropped',...overrides } }

export function projectNativeMathToLatex(mathObject) { return { source:latexRenderer(mathObject),authority:'projection-only',fidelity:fidelity('latex-export') } }
export function projectNativeMathToMathML(mathObject) { return { source:mathmlRenderer(mathObject),authority:'projection-only',fidelity:fidelity('presentation-mathml-export',{semantics:'preserved-subset',presentation:'preserved-subset'}) } }

export function classifyLatexImportCandidate(source) {
  return { authority:'candidate-only',source_kind:'latex',fidelity:{ dimensions_required:true,semantic_exactness_assumed:false,source_length:typeof source==='string'?source.length:0 } }
}
export function classifyMathMLImportCandidate(sourceKind) {
  return { authority:'candidate-only',source_kind:sourceKind,fidelity:{ presentation_preservation_possible:sourceKind==='presentation-mathml',full_semantics_assumed:false } }
}
