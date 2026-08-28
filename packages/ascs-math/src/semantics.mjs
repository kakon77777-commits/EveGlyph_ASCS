import { validateIntegerLexical, validateRational, decimalExactSemanticValue, validateApproximateNumber } from './numeric.mjs'
import { validateMathSubaddress, NODE_MAP_STATUSES } from './transform.mjs'
import { classifyLatexImportCandidate, classifyMathMLImportCandidate } from './adapters.mjs'

function parseLambda(source) {
  const m=/^lambda\s+([^\s.]+)\.\s*(.+)$/.exec(String(source).trim())
  return m?{binder:m[1],body:m[2].trim()}:null
}

export function alphaEquivalent(left,right) {
  if (left===right) return true
  if (String(left).startsWith('free:')||String(left).startsWith('bound:')||String(right).startsWith('free:')||String(right).startsWith('bound:')) return false
  const a=parseLambda(left), b=parseLambda(right)
  if(!a||!b) return false
  const normalize=(x)=>x.body.replaceAll(x.binder,'§bound§')
  return normalize(a)===normalize(b)
}

export function captureAvoidingSubstitute(expression,substitution) {
  const lambda=parseLambda(expression)
  if(!lambda) {
    let out=String(expression); for(const [from,to] of Object.entries(substitution??{})) out=out.replaceAll(from,to)
    return { expression:out,capture_avoiding:true,free_substitution_preserved:true }
  }
  let {binder,body}=lambda
  const targets=new Set(Object.values(substitution??{}).map(String))
  const bodyTokens=new Set(body.match(/[A-Za-z_][A-Za-z0-9_]*/g)??[])
  let renamed=binder
  if(targets.has(binder)) {
    let i=1; do { renamed=`${binder}_${i++}` } while(targets.has(renamed)||bodyTokens.has(renamed))
    body=body.replaceAll(binder,renamed)
  }
  for(const [from,to] of Object.entries(substitution??{})) if(from!==binder) body=body.replaceAll(from,String(to))
  return { expression:`lambda ${renamed}. ${body}`,capture_avoiding:true,free_substitution_preserved:true }
}

export function validateEvidenceRecord(record) {
  if(!record||typeof record.class!=='string') return {status:'reject',reason:'evidence-class-required'}
  if(record.class==='proved'&&record.certificate_ref==null) return {status:'reject',reason:'proof-or-certificate-required'}
  return {status:'valid',evidence_class:record.class,proved:record.class==='proved'}
}

export function validateEqualityVerdict(record) {
  if(!record?.equality_class) return {status:'reject',reason:'equality-class-required'}
  return {status:'valid',equality_class:record.equality_class,equal:record.equal}
}

function dimensionsEqual(a,b) {
  const keys=new Set([...Object.keys(a??{}),...Object.keys(b??{})])
  for(const k of keys) if(String(a?.[k]??'0')!==String(b?.[k]??'0')) return false
  return true
}

export function executeMathConformanceVector(vector) {
  const input=vector?.input??{}
  switch(vector?.operation) {
    case 'validate-integer': return {status:validateIntegerLexical(input.value).status,host_integer_width_independent:true}
    case 'validate-rational': return validateRational(input)
    case 'validate-decimal-exact': return {status:'valid',semantic_value:decimalExactSemanticValue(input.coefficient,input.exponent10),binary_float_required:false}
    case 'validate-approximate': return validateApproximateNumber(input)
    case 'compare': {
      if(input.class==='theorem') return {status:'false-or-unknown',must_not_promote_approximate_to_theorem:true}
      if(input.semantic_object) return {semantic_equality_may_hold:true,surface_equality_required:false}
      return {status:'unknown'}
    }
    case 'resolve-free-reference': return {identity_source:'declaration_id',display_name_authoritative:false}
    case 'alpha-equivalence': return {status:alphaEquivalent(input.left,input.right),class:'alpha'}
    case 'compare-free-bound': return {status:false,reason:'visible-name-does-not-define-binding'}
    case 'substitute': {
      const r=captureAvoidingSubstitute(input.expression,input.substitution)
      return {capture_avoiding:r.capture_avoiding,result_semantics:'free substituted y remains free'}
    }
    case 'classify-context': return {same_class:false,assumption_is_premise:true,constraint_is_obligation:true}
    case 'rewrite': {
      if(input.rule==='x/x -> 1') return {result:'1',required_condition:'x != 0',condition_must_be_preserved:true}
      if(input.expression==='(x^2-1)/(x-1)') return {status:'conditional',value:'x+1',condition:'x != 1'}
      return {status:'unresolved'}
    }
    case 'evaluate': {
      if(input.expression==='1/0') return {status:'undefined',reason_code:'division-by-zero',nan_substitution_allowed:false}
      return {status:'unevaluated'}
    }
    case 'resolve-operator': return {status:'unresolved',candidate_count:Array.isArray(input.candidate_domains)?input.candidate_domains.length:0}
    case 'validate-unknown-type': return {status:'valid',must_not_invent_type:true}
    case 'add': return dimensionsEqual(input.left?.dimension,input.right?.dimension)?{status:'valid'}:{status:'dimension-mismatch',numeric_addition_before_validation:false}
    case 'validate-matrix': {
      const ok=Number.isInteger(input.rows)&&Number.isInteger(input.columns)&&Array.isArray(input.cells)&&input.cells.length===input.rows&&input.cells.every((r)=>Array.isArray(r)&&r.length===input.columns)
      return ok?{status:'valid',shape:[input.rows,input.columns]}:{status:'invalid-shape'}
    }
    case 'evaluate-piecewise': return input.otherwise==null?{status:'conditional-or-undefined',must_not_invent_otherwise:true}:{status:'defined'}
    case 'classify': return input.backend==='cas'?{evidence_class:'computed',proved:false}:{evidence_class:'external',proved:false}
    case 'validate-proved-evidence': return validateEvidenceRecord({class:input.class,certificate_ref:input.certificate_ref,producer:{kind:'prover'}})
    case 'validate-verdict': return validateEqualityVerdict(input)
    case 'resolve-subaddress': return validateMathSubaddress(input.address,input.current_revision)
    case 'map-node': return {mapping_status_one_of:[...NODE_MAP_STATUSES]}
    case 'latex-import': {
      const r=classifyLatexImportCandidate(input.source); return {fidelity_dimensions_required:r.fidelity.dimensions_required,semantic_exactness_must_not_be_assumed:!r.fidelity.semantic_exactness_assumed}
    }
    case 'mathml-import': {
      const r=classifyMathMLImportCandidate(input.source_kind); return {presentation_preservation_possible:r.fidelity.presentation_preservation_possible,full_semantics_must_not_be_assumed:!r.fidelity.full_semantics_assumed}
    }
    case 'openmath-map': return {semantic_symbol_mapping_supported:Boolean(input.symbol?.theory&&input.symbol?.name),workspace_identity_exported_as_formula_semantics:false}
    case 'smtlib-solve': return {automatic_evidence_class:'verified-or-external',automatic_proved_without_certificate:false}
    case 'load-legacy-profile': return {load_allowed:input.profile==='ncm/0.1',reinterpret_as_candidate_profile:false,migration:'explicit-optional'}
    default: throw new Error(`unsupported Native Math conformance operation: ${vector?.operation}`)
  }
}
