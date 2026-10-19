// Runs on GitHub Actions every ~5 minutes (free). Sends a push to everyone who
// favorited a place when a prayer is added there or its time is updated.
const admin=require("firebase-admin");
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))});
const db=admin.firestore();
const pk=i=>[i.venue,i.suburb,i.state].join("|").toLowerCase().replace(/[^a-z0-9|]+/g,"-");
const DEAD=["messaging/registration-token-not-registered","messaging/invalid-registration-token"];
(async()=>{
  const start=Date.now(),meta=db.doc("meta/notifier"),m=await meta.get();
  if(!m.exists){await meta.set({lastRun:start});console.log("First run: nothing sent. Ready.");return}
  const last=m.data().lastRun;
  const [a,b]=await Promise.all([
    db.collection("prayers").where("created",">",last).get(),
    db.collection("prayers").where("updatedAt",">",last).get()]);
  const jobs=new Map();
  a.docs.forEach(d=>jobs.set(d.id,{p:d.data(),prefix:"New prayer: "}));
  b.docs.forEach(d=>{if(!jobs.has(d.id))jobs.set(d.id,{p:d.data(),prefix:"Time updated: "})});
  console.log("Changed prayers:",jobs.size);
  for(const {p,prefix} of jobs.values()){
    if(p.hidden)continue;
    const key=pk(p);
    const subs=await db.collection("subscribers").where("places","array-contains",key).get();
    const tokens=subs.docs.map(d=>d.id);
    console.log(key,"subscribers:",tokens.length);
    for(let i=0;i<tokens.length;i+=500){
      const batch=tokens.slice(i,i+500);
      const res=await admin.messaging().sendEachForMulticast({tokens:batch,
        notification:{title:"Notification from my favorite places",body:prefix+p.venue+" · "+p.date+" "+p.time},
        data:{tag:key+"|"+p.date+p.time,url:"./"}});
      console.log("sent ok:",res.successCount,"failed:",res.failureCount);
      await Promise.all(res.responses.map((r,j)=>{
        if(r.success)return null;
        console.error("failed:",r.error&&r.error.code);
        return r.error&&DEAD.includes(r.error.code)?db.collection("subscribers").doc(batch[j]).delete():null;
      }));
    }
  }
  await meta.set({lastRun:start});
})().catch(e=>{console.error(e);process.exit(1)});
