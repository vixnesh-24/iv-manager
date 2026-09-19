import { supabase } from '../lib/supabase';

const students = [
  { register_number: '24CSB01', name: 'MADHAN KUMAR P', section: '' },
  { register_number: '24CSB02', name: 'MADHUKRISHNA S', section: '' },
  { register_number: '24CSB03', name: 'MITHUN R K', section: '' },
  { register_number: '24CSB04', name: 'MUGUNDHAN T', section: '' },
  { register_number: '24CSB05', name: 'NAVEEN G R', section: '' },
  { register_number: '24CSB06', name: 'NAVEEN KUMAR R', section: '' },
  { register_number: '24CSB07', name: 'NAVINKUMAR S', section: '' },
  { register_number: '24CSB08', name: 'NEHA P', section: '' },
  { register_number: '24CSB09', name: 'NISHANTHI S', section: '' },
  { register_number: '24CSB10', name: 'NITINRAM K S', section: '' },
  { register_number: '24CSB11', name: 'PAVALAN K', section: '' },
  { register_number: '24CSB12', name: 'PAVITHRA D', section: '' },
  { register_number: '24CSB13', name: 'PRABHAVATHI P', section: '' },
  { register_number: '24CSB14', name: 'PRAKSHITHA S', section: '' },
  { register_number: '24CSB15', name: 'PRASANTH J', section: '' },
  { register_number: '24CSB16', name: 'PREETHI M', section: '' },
  { register_number: '24CSB17', name: 'PREETHI V', section: '' },
  { register_number: '24CSB18', name: 'PRETHIKA S', section: '' },
  { register_number: '24CSB19', name: 'PRIYANKA S', section: '' },
  { register_number: '24CSB20', name: 'PUSHPA P', section: '' },
  { register_number: '24CSB21', name: 'RAGAVI R', section: '' },
  { register_number: '24CSB22', name: 'RAGUL N', section: '' },
  { register_number: '24CSB23', name: 'RAJASRI V', section: '' },
  { register_number: '24CSB24', name: 'RAMAKRISHNAN K', section: '' },
  { register_number: '24CSB25', name: 'RAMESH R', section: '' },
  { register_number: '24CSB26', name: 'RANJITH R', section: '' },
  { register_number: '24CSB27', name: 'RITHIKA S', section: '' },
  { register_number: '24CSB28', name: 'RUBAN K', section: '' },
  { register_number: '24CSB29', name: 'SAKKTHI A', section: '' },
  { register_number: '24CSB30', name: 'SANJAY S', section: '' },
  { register_number: '24CSB31', name: 'SANTHIYA MEENA E', section: '' },
  { register_number: '24CSB32', name: 'SANTHOSH K', section: '' },
  { register_number: '24CSB33', name: 'SARABESWARI B', section: '' },
  { register_number: '24CSB34', name: 'SASHWITHA G', section: '' },
  { register_number: '24CSB35', name: 'SHANTHINI PRIYA M', section: '' },
  { register_number: '24CSB36', name: 'SHARUN S', section: '' },
  { register_number: '24CSB37', name: 'SHIVANI SRI B', section: '' },
  { register_number: '24CSB38', name: 'SHRI LAKSHANA S K', section: '' },
  { register_number: '24CSB39', name: 'SINDHUJA S', section: '' },
  { register_number: '24CSB40', name: 'SOWNDARYA P', section: '' },
  { register_number: '24CSB41', name: 'SRI HARSHINI K', section: '' },
  { register_number: '24CSB42', name: 'SRIDHARSHAN S', section: '' },
  { register_number: '24CSB43', name: 'SUBASH CHANDRA BOSE K', section: '' },
  { register_number: '24CSB44', name: 'SUBHA DHARSHINI G', section: '' },
  { register_number: '24CSB45', name: 'SUBHASHINI N', section: '' },
  { register_number: '24CSB46', name: 'SYED FATHIMA K', section: '' },
  { register_number: '24CSB47', name: 'TAMIL NANGAI K', section: '' },
  { register_number: '24CSB48', name: 'THAMARAI SELVI D', section: '' },
  { register_number: '24CSB49', name: 'THARUN M', section: '' },
  { register_number: '24CSB50', name: 'VARSHINI G', section: '' },
  { register_number: '24CSB51', name: 'VARSHINI S', section: '' },
  { register_number: '24CSB52', name: 'VASANTH B', section: '' },
  { register_number: '24CSB53', name: 'VIGNESH S M', section: '' },
  { register_number: '24CSB54', name: 'VISHNU PRASATH S', section: '' },
  { register_number: '24CSB55', name: 'VISHVAKKANNAN S', section: '' },
  { register_number: '24CSB56', name: 'YAMUNA R', section: '' },
  { register_number: '24CSB57', name: 'YOGARATHNA E', section: '' },
  { register_number: '24CSB58', name: 'SIVASANMUGAM S', section: '' },
  { register_number: '24CSB59', name: 'CHATRAPATHI U', section: '' },
  { register_number: '24CSB60', name: 'MAZEED AHAMED A', section: '' },
  { register_number: '24CSB61', name: 'NITHISH R P', section: '' },
  { register_number: '24CSB62', name: 'SAITHARUN D', section: '' },
];

async function seed() {
  const { data, error } = await supabase.from('students').upsert(
    students.map((s) => ({ ...s, amount_due: 0 })),
    { onConflict: 'register_number' },
  );
  if (error) {
    console.error('Error seeding students:', error);
  } else {
    console.log('Seeded students:', (data as any)?.length ?? students.length);
  }
}

seed();
