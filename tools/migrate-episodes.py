import re,json
from pathlib import Path
text=Path('index.html').read_text()
a=text.index('const templates={')
b=text.index('\nlet shots=[]',a)
js=text[a:b]
pattern=r'\["([^"]+)","([^"]+)","([^"]+)",([0-9]+(?:\.[0-9]+)?)\]'
def parse(part):
    lines=re.findall(pattern,part)
    if not lines:raise RuntimeError('No shots extracted')
    return [{'id':f'shot-{i+1:02}','dialogue':txt,'speaker':speaker,'camera':cam,'duration':float(duration),
             'intent':['setup','contrast','escalation','reaction','reveal','punchline'][min((i*6)//max(1,len(lines)),5)],
             'emotion':'neutral','action':'listen' if cam=='screen' else 'speak',
             'firstFrameStatus':'not_created'} for i,(txt,speaker,cam,duration) in enumerate(lines)]
comedy=parse(js.split('comedy:[',1)[1].split('mystery:[',1)[0])
mystery=parse(js.split('mystery:[',1)[1])
if len(comedy)!=14 or len(mystery)!=6:raise RuntimeError(f'Unexpected source counts: {len(comedy)},{len(mystery)}')
characters=[
 {'id':'dev','name':'DEV','visualIdentity':'Original stylized low-poly adult developer, visible facial expressions, coherent hoodie and hair silhouette','voice':{'profile':'developer','voiceLock':'Consistent expressive adult voice, clear words, measured comic timing; maintain this exact profile between shots'},'sheetStatus':'not_created','expressions':['neutral','worried','surprised','happy']},
 {'id':'blue','name':'BLUE','visualIdentity':'Original blue-grey expressive robot with a cohesive rounded metal body and contrasting digital face','voice':{'profile':'blue-assistant','voiceLock':'Distinct playful high-mid synthetic English voice with precise pacing and consistent timbre'},'sheetStatus':'not_created','expressions':['neutral','happy','worried','surprised']},
 {'id':'orange','name':'ORANGE','visualIdentity':'Original warm orange robot with a cohesive rounded metal body and expressive contrasting digital face','voice':{'profile':'orange-assistant','voiceLock':'Distinct warm synthetic English voice, emotionally controlled, deadpan comedic delivery'},'sheetStatus':'not_created','expressions':['neutral','happy','worried','surprised']}
]
def make(id,title,logline,scenes,master):
 return {
  'schema':'frameforge.project/1','id':id,'title':title,'logline':logline,
  'output':{'width':1080,'height':1920,'fps':30},
  'style':{'styleLock':'Original cinematic stylized low-poly 3D. Unified characters, detailed moody studio, rich key/fill/rim lighting. No anime, no Pixar imitation, no photorealism. Stable proportions and identities.'},
  'environment':{'id':'developer-neon-lab','description':'Moody layered developer studio with desk, monitor, ambient fixtures and readable story-relevant interface props.','safeZone':{'top':220,'bottom':420}},
  'characters':characters,
  'shots':scenes,
  'audio':{'state':'mastered' if master else 'storyboard_only','masterUrl':master,
           'audioAlignment':'approximate_existing_v4_engine_not_phoneme_aligned'}
 }
root=Path('projects')
root.joinpath('zero-latency.frameforge.json').write_text(json.dumps(make('zero-latency','Zero Latency','A developer asks two AI assistants to make an app load instantly. Their solution is spectacularly wrong.',comedy,'https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/zero-latency-stereo-foley-v2.ogg'),indent=2)+'\n')
root.joinpath('mountain-mystery.frameforge.json').write_text(json.dumps(make('mountain-mystery','The Hidden City','A mysterious mountain hides a forgotten futuristic city.',mystery,None),indent=2)+'\n')
print('Exact original dialogue/camera/duration migrated:',len(comedy),len(mystery))
