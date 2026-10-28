import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyFarm, Batch, StockMovement } from '../src/types';
import { cashEntries, costRecords, normalizeFarm, stockBalances, reconcileLifecycle, refreshLinkedFeedCosts } from '../src/utils/farm';
import { calendarEntries, feedOverview, suggestedExit } from '../src/utils/rearing';
import { calculateBatchSummary } from '../src/utils/calculations';

const batch: Batch = { id: 'batch-1', name: 'Lote prueba', startDate: '2026-01-01', initialCount: 100, initialCostPerPullet: 2, status: 'active', createdAt: '2026-01-01', ageOnArrivalDays: 7 };
const move = (id: string, type: StockMovement['type'], product: string, quantityKg: number, amount: number): StockMovement => ({ id, type, product, quantityKg, amount, date: '2026-01-02', contact: '', notes: '' });

test('weekly purchases allocate their own prices and corrections recalculate linked consumption', () => {
  const first = move('p1','purchase','Recría',100,1000);
  const second = {...move('p2','purchase','Recría',100,1200),date:'2026-01-09'};
  const data = {...emptyFarm(),batches:[batch],movements:[first,second,
    {...move('f1','feed','Recría',20,200),batchId:batch.id,purchaseId:'p1'},
    {...move('f2','feed','Recría',25,300),date:'2026-01-09',batchId:batch.id,purchaseId:'p2',quantityUnit:'bolsas' as const,bagWeightKg:25}]};
  normalizeFarm(data);
  assert.equal(calculateBatchSummary(batch,costRecords(data)).totalExpenses,700);
  assert.equal(cashEntries(data).reduce((s,e)=>s+e.expense,0),2400);
  first.amount=1500; refreshLinkedFeedCosts(data); normalizeFarm(data);
  assert.equal(data.movements[2].amount,300);
  assert.equal(data.movements[3].amount,300);
  assert.throws(()=>normalizeFarm({...data,movements:data.movements.filter(m=>m.id!=='p1')}));
  assert.throws(()=>normalizeFarm({...data,movements:data.movements.map(m=>m.id==='f1'?{...m,quantityKg:101,amount:1515}:m)}));
  assert.throws(()=>normalizeFarm({...data,movements:data.movements.map(m=>m.id==='f2'?{...m,date:'2026-01-02'}:m)}));
  const summary=feedOverview(data,batch.id,'2026-01-09');
  assert.equal(summary.totalKg,45); assert.equal(summary.todayKg,25); assert.equal(summary.recentKg,25);
  assert.equal(summary.weekly.length,2); assert.equal(summary.cost,600);
});

test('calendar distinguishes planned arrivals, actual departures and completed work dates', () => {
  const planned={...batch,id:'planned',name:'Próximo',status:'planned' as const,startDate:'2026-02-01',expectedExitDate:'2026-05-24',barn:'Galpón chico'};
  const data={...emptyFarm(),batches:[{...batch,status:'completed' as const,endDate:'2026-01-20'},planned],departures:[{id:'exit',batchId:batch.id,date:'2026-01-20',count:100,amount:300,notes:''}],tasks:[{id:'clean',title:'Limpiar',batchId:batch.id,date:'2026-01-21',completedDate:'2026-01-22',status:'done' as const,kind:'limpieza' as const,cost:20,notes:''}]};
  const events=calendarEntries(data);
  assert.equal(events.filter(e=>e.kind==='departure'&&!e.planned).length,1);
  assert.equal(events.find(e=>e.taskId==='clean')?.date,'2026-01-22');
  assert.equal(events.find(e=>e.id==='arrival-planned')?.planned,true);
  assert.match(events.find(e=>e.id==='arrival-planned')!.detail,/Galpón chico/);
  assert.equal(suggestedExit('2026-01-01',7),'2026-04-16');
});

test('purchases, production ingredients, sales and feed update stock in kilos', () => {
  const movements = [move('1','purchase','Maíz',100,50),move('2','purchase','Soja',40,40),{ ...move('3','production','Ración',100,10), ingredients: [{product:'Maíz',quantityKg:70},{product:'Soja',quantityKg:30}] },move('4','sale','Ración',20,30),{...move('5','feed','Ración',5,5), batchId: batch.id}];
  assert.deepEqual(stockBalances(movements,'2026-01-03'), { Maíz: 30, Soja: 10, Ración: 75 });
  assert.deepEqual(stockBalances(movements,'2026-01-01'), {});
});
test('feed allocation does not double count purchased stock as a cash expense', () => {
  const data = { ...emptyFarm(), batches: [batch], movements: [move('1','purchase','Ración',100,100), {...move('2','feed','Ración',10,10),batchId:batch.id},move('3','sale','Ración',20,40)] };
  assert.equal(cashEntries(data).reduce((sum,e) => sum + e.expense, 0),300);
  assert.equal(cashEntries(data).reduce((sum,e) => sum + e.income, 0),40);
  assert.equal(calculateBatchSummary(batch,costRecords(data)).totalExpenses,210);
});
test('departures reduce birds, completed ages stop and planned batches have no birds on site', () => {
  const exits = [{id:'d',batchId:batch.id,date:'2026-01-15',count:30,amount:100,notes:''}];
  assert.equal(calculateBatchSummary(batch,[],exits).currentLiveCount,70);
  assert.equal(calculateBatchSummary({...batch,status:'completed',endDate:'2026-01-15'},[]).currentAgeDays,21);
  assert.equal(calculateBatchSummary({...batch,status:'planned'},[]).currentLiveCount,0);
});
test('completed jobs count once; planned work is not a real expense', () => {
  const data = { ...emptyFarm(), batches:[batch], tasks:[{id:'t',title:'Limpieza',date:'2026-01-02',batchId:batch.id,kind:'limpieza' as const,status:'done' as const,completedDate:'2026-01-03',cost:30,notes:''},{id:'u',title:'Pendiente',date:'2026-01-04',kind:'otro' as const,status:'pending' as const,cost:40,notes:''}] };
  assert.equal(cashEntries(data).reduce((s,e) => s + e.expense,0),230);
  assert.equal(calculateBatchSummary(batch,costRecords(data)).totalExpenses,230);
});
test('old exports migrate without carrying PINs or losing records', () => {
  const result = normalizeFarm({version:'2.0',pin:'123456',batches:[batch],records:[]});
  assert.equal(result.batches.length,1);
  assert.equal(result.schemaVersion,3);
  assert.equal('pin' in result,false);
});
test('correcting a departure reopens its batch without losing its history', () => {
  const data = { ...emptyFarm(), batches: [{...batch}], departures: [{id:'d',batchId:batch.id,date:'2026-01-15',count:100,amount:100,notes:''}] };
  reconcileLifecycle(data,batch.id);
  assert.equal(data.batches[0].status,'completed');
  data.departures[0].count = 90;
  reconcileLifecycle(data,batch.id);
  assert.equal(data.batches[0].status,'active');
  assert.equal(data.batches[0].endDate,undefined);
  assert.equal(data.departures.length,1);
});
test('bad imports, unknown versions, duplicate ids, invalid dates and excessive departures are rejected', () => {
  const data = {...emptyFarm(),batches:[batch]};
  for (const bad of [null, {...data,schemaVersion:4}, {...data,batches:[batch,batch]}, {...data,batches:[{...batch,startDate:'2026-02-30'}]}, {...data,movements:[{...move('1','feed','Ración',1,1),batchId:'missing'}]}, {...data,departures:[{id:'d',batchId:batch.id,date:'2026-01-02',count:101,amount:1,notes:''}]}]) assert.throws(() => normalizeFarm(bad));
});
