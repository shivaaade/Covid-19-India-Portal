const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
const jwt = require("jsonwebtoken");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

let db = null;

const connectDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("successfully created url");
    });
  } catch (e) {
    console.log(`error: ${e.message}`);
    process.exit(1);
  }
};
connectDbServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

// middileware function

const authentictionLogin = (request, response, next) => {
  let jwtToken;
  const authUser = request.headers["authorization"];
  if (authUser !== undefined) {
    jwtToken = authUser.split(" ")[1];
    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      jwt.verify(jwtToken, "shiva1234", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          next();
        }
      });
    }
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
};

// get /states/
const convertstatedb = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

app.get("/states/", authentictionLogin, async (request, response) => {
  //   const dbstates = `SELECT * FROM state`;
  //   const playersArray = await db.all(dbstates);
  //   response.send(
  //     playersArray.map((eachPlayer) =>
  //       convertDbObjectToResponseObject(eachPlayer)
  //     )
  //   );
  const getstatequery = `select * from state;`;
  const getstates = await db.all(getstatequery);
  response.send(getstates.map((eachstate) => convertstatedb(eachstate)));
});

// API login

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const findUsers = `SELECT * FROM user WHERE username = '${username}';`;
  const findUser = await db.get(findUsers);
  if (findUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, findUser.password);
    if (isPassword) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "shiva1234");
      const finaltoken = { jwtToken };
      response.send(finaltoken);
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// get /states/:stateId/

app.get("/states/:stateId/", authentictionLogin, async (request, response) => {
  const { stateId } = request.params;
  const dbstateId = `SELECT * FROM state WHERE state_id = '${stateId}';`;
  const finalId = await db.get(dbstateId);
  let snakeToCamel = (finalId) => {
    return {
      stateId: finalId.state_id,
      stateName: finalId.state_name,
      population: finalId.population,
    };
    snakeToCamel();
  };
  response.send(snakeToCamel(finalId));
});

//post  /districts/

app.post("/districts/", authentictionLogin, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const dbDistrict = `insert into district(district_name,state_id,cases,cured,active,deaths)
            values('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const final = await db.run(dbDistrict);
  response.send("District Successfully Added");
});

//get /districts/:districtId/

app.get(
  "/districts/:districtId/",
  authentictionLogin,
  async (request, response) => {
    const { districtId } = request.params;
    const dbDistricts = `SELECT * FROM district WHERE district_id = '${districtId}';`;
    const each = await db.get(dbDistricts);

    let snakeToCamel = (each) => {
      return {
        districtId: each.district_id,
        districtName: each.district_name,
        stateId: each.state_id,
        cases: each.cases,
        cured: each.cured,
        active: each.active,
        deaths: each.deaths,
      };
    };
    response.send(snakeToCamel(each));
  }
);

// delete

app.delete(
  "/districts/:districtId/",
  authentictionLogin,
  async (request, response) => {
    const { districtId } = request.params;
    const dbdelete = `delete from district where district_id = '${districtId}';`;
    const final = await db.run(dbdelete);
    response.send("District Removed");
  }
);

// put /districts/:districtId/

app.put(
  "/districts/:districtId/",
  authentictionLogin,
  async (request, response) => {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const { districtId } = request.params;
    const dbput = `update district set district_name = '${districtName}',state_id = '${stateId}',
        cases =  '${cases}',cured = '${cured}', active =  '${active}',
        deaths =  '${deaths}' where district_id='${districtId}';`;
    const final = await db.run(dbput);
    response.send("District Details Updated");
  }
);

// get /states/:stateId/stats/

app.get(
  "/states/:stateId/stats/",
  authentictionLogin,
  async (request, response) => {
    const { stateId } = request.params;
    const dbget = `select sum(cases) as totalCases,sum(cured) as totalCured,
     sum(active) as totalActive,
    sum(deaths) as totalDeaths  from district where state_id = '${stateId}';`;
    const final = await db.get(dbget);
    response.send(final);
  }
);

//ccbp submit NJSCPIKNGV
module.exports = app;
