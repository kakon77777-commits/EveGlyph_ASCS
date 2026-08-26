# v0.8 External Reference Matrix

| Scheme | What v0.8 treats it as | Resolution | Local identity binding | Capability |
|---|---|---|---|---|
| URI | generic external resource reference | scheme/profile dependent | reference-only by default | none |
| DOI | persistent external referent identifier | DOI/Handle resolver profile | explicit binding required | `identity.bind.external` for federation |
| DID | decentralized identifier reference | DID method/resolver profile | explicit binding required | resolution never grants capabilities |
| SWHID | intrinsic software artifact identifier/evidence | optional resolver; intrinsic ID remains meaningful without location | explicit binding required | none by default |

Core invariant:

$$
Resolve_{ext}(r)=Resolved\not\Rightarrow A^{id}_{local}=r.
$$
