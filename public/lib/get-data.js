//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4
const client = new FHIR.client({
  serverUrl: "https://r4.smarthealthit.org",
  tokenResponse: {
    patient: "f2316789-30c4-4c06-9193-0ca5475bbb1b"
  }
});
const abortController = new AbortController();
const signal = abortController.signal;
var latestWeightResource;

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender;
  document.getElementById('dob').innerHTML = pt.birthDate;
}

//function to display list of medications
function displayMedication(meds) {
  med_list.innerHTML += "<li> " + meds + "</li>";
}

//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {
    return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// create a patient object to initalize the patient
function defaultPatient() {
  return {
    height: {
      value: ''
    },
    weight: {
      value: ''
    },
    sys: {
      value: ''
    },
    dia: {
      value: ''
    },
    ldl: {
      value: ''
    },
    hdl: {
      value: ''
    },
    note: 'No Annotation',
  };
}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
  note.innerHTML = annotation;
}

//function to display the observation values you will need to update this
function displayObservation(obs) {
  hdl.innerHTML = obs.hdl;
  height.innerHTML = obs.height;
  weight.innerHTML = obs.weight;
  ldl.innerHTML = obs.ldl;
  sys.innerHTML = obs.sys;
  dia.innerHTML = obs.dia;
}

//once fhir client is authorized then the following functions can be executed
FHIR.oauth2.ready().then(function(client) {
  console.log(client)
  console.log(`${client.patient.id}`)
  var patientId = client.patient.id
  // In case patient empty make manual request to test patient
  if (!client.patient || !client.patient.id || `${client.patient.id}` == "null") {
    patientId = "f2316789-30c4-4c06-9193-0ca5475bbb1b"
    console.log("[Tio]HERE")
  } else {
    console.log("[Tio]NOT HERE")
  }
  console.log("Final Patient Id ", patientId)


  // get patient object and then display its demographics info in the banner
  client.request(`Patient/${patientId}`).then(
    function(patient) {
      displayPatient(patient);
      console.log(patient);
    }
  );

  // get observation resoruce values
  // you will need to update the below to retrive the weight and height values
  var query = new URLSearchParams();

  query.set("patient", patientId);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|8302-2',// — Body height
    'http://loinc.org|29463-7',// — Body weight
    'http://loinc.org|8462-4',
    'http://loinc.org|8480-6',
    'http://loinc.org|2085-9',
    'http://loinc.org|2089-1',
    'http://loinc.org|55284-4',
    'http://loinc.org|3141-9',
  ].join(","));

  client.request("Observation?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(ob) {
      console.log("ob", ob)
      // group all of the observation resoruces by type into their own
      var byCodes = client.byCodes(ob, 'code');
      var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
      var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
      var hdl = byCodes('2085-9');
      var ldl = byCodes('2089-1');
      var height = byCodes('8302-2');
      var weight = byCodes('29463-7');
      console.log(weight)
      latestWeightResource = weight[0]

      // create patient object
      var p = defaultPatient();

      // set patient value parameters to the data pulled from the observation resoruce
      if (typeof systolicbp != 'undefined') {
        p.sys = systolicbp;
      } else {
        p.sys = 'undefined'
      }

      if (typeof diastolicbp != 'undefined') {
        p.dia = diastolicbp;
      } else {
        p.dia = 'undefined'
      }

      p.hdl = getQuantityValueAndUnit(hdl[0]);
      p.ldl = getQuantityValueAndUnit(ldl[0]);
      p.height = getQuantityValueAndUnit(height[0]);
      p.weight = getQuantityValueAndUnit(weight[0]);
      displayObservation(p)

    });


  // dummy data for medrequests
  var medResults = []
  var medQuery = new URLSearchParams();
  
  medQuery.set("patient", patientId);
  medQuery.set("_count", 100);
  medQuery.set("_sort", "-date");
  client.request("MedicationRequest?" + medQuery, {
    pageLimit: 0,
    flat: true
  }).then(meds =>{
    console.log(meds)
    for (var i = 0; i < meds.length; i++){
      //add both active and stopped medication
      if (meds[i].status == "active" || meds[i].status == "stopped" ){
        medResults = medResults.concat(meds[i].medicationCodeableConcept.text)
        console.log("adding meds")
      } else {
        console.log("med status isn't active or stopped instead: ", meds[i].status )
      }
    }
    // get medication request resources this will need to be updated
    // the goal is to pull all the medication requests and display it in the app. It can be both active and stopped medications
    medResults.forEach(function(med) {
      displayMedication(med);
    })
  });  

  //update function to take in text input from the app and add the note for the latest weight observation annotation
  //you should include text and the author can be set to anything of your choice. keep in mind that this data will
  // be posted to a public sandbox
  function addWeightAnnotation() {
    var annotation = document.getElementById('annotation').value;
    latestWeightResource.note = [{
      authorString: "spriambada3",
      time: new Date().toISOString(),
      text: annotation
    }]
    console.log("weight annot ", latestWeightResource)
    client.update(latestWeightResource, { signal });
    displayAnnotation(annotation);
  }

  //event listner when the add button is clicked to call the function that will add the note to the weight observation
  document.getElementById('add').addEventListener('click', addWeightAnnotation);


}).catch(console.error);
