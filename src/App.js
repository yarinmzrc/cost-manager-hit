import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Button from '@mui/material/Button';
import './App.css';

const indexedDB = window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB;

const defaultCost = {
  costName: '',
  amount: 0,
  month: 1,
  year: 1990,
  category: ''
}

function App() {
  const [cost, setCost] = useState(defaultCost)
  const [allCosts, setAllCosts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterCosts, setFilterCosts] = useState({month: 1, year: 1990})

  const handleChange = (event) => {
    setCost({...cost, [event.target.name]: event.target.value});
  };

  const handleFilterChange = (event) => {
    setFilterCosts({...filterCosts, [event.target.name]: event.target.value});
  };

  const createCostsDB = () => {
    setIsLoading(true)
    if (!window.indexedDB) console.log("The browser doesn't support IndexedDB")

    const request = indexedDB.open("cost-manager", 2);

    request.onsuccess = () => {
      const db = request.result;

      const transaction = db.transaction("costs", "readonly");
  
      const store = transaction.objectStore("costs");
  
      const allCosts = store.getAll();
  
      allCosts.onsuccess = () => {
        console.log(allCosts.result);
        setAllCosts(allCosts.result)
        allCosts.oncomplete = () => {
          db.close();
          setIsLoading(false)
        }
      }
    }

    request.onerror = (event) => {
        console.error("An error occurred with indexedDB");
        console.error(event)
        setIsLoading(false)
    }

    request.onupgradeneeded = function () {
        const db = request.result;
        const store = db.createObjectStore("costs", { keyPath: "id", autoIncrement: true });
        store.createIndex("name", ["name"], { unique: true });
        store.createIndex("sum", ["sum"], { unique: false });
        store.createIndex("category", ["category"], { unique: false });
        store.createIndex("year", ["year"], { unique: false });
        store.createIndex("month", ["month"], { unique: false });
        store.createIndex('monthAndYear', ['month','year'], {unique:false});
    };
 }

 useEffect(() => {
  createCostsDB();
  setIsLoading(false)
}, [])

const handleFilter = () => {
  const dbPromise = indexedDB.open('cost-manager', 2)

  dbPromise.onsuccess = () => {
    const db = dbPromise.result;

    const transaction = db.transaction('costs', 'readwrite');

    const costsData = transaction.objectStore('costs');

    const index = costsData.index('monthAndYear');

    const costsRes = index.openCursor(IDBKeyRange.only([filterCosts.month, filterCosts.year]))

    costsRes.onsuccess = () => {
      transaction.oncomplete = () => {
        setAllCosts([...allCosts, cost])
        setCost(defaultCost)
        db.close();
      }
    }

    costsRes.onerror = () => {
      alert("Error!")
    }
  }
}

const handleSubmit = () => {
  const dbPromise = indexedDB.open('cost-manager', 1)
  
  if(cost.amount && cost.category && cost.costName && cost.month && cost.year) {
  dbPromise.onsuccess = () => {
    const db = dbPromise.result;

    const transaction = db.transaction('costs', 'readwrite');

    const costsData = transaction.objectStore('costs');

    const costsRes = costsData.put(cost)

    costsRes.onsuccess = () => {
      transaction.oncomplete = () => {
        setAllCosts([...allCosts, cost])
        setCost(defaultCost)
        db.close();
      }

      alert("Cost Added!")
    }

    costsRes.onerror = () => {
      alert("Error!")
    }
  }
} else {
  alert("Please Fill all the fields!")
}

}

  return isLoading ? ('Loading') : (
    <div className="App">
      <h1>Cost Manager</h1>
      <div className="costs-form">
        <Card sx={{ gap: '30px', padding: '30px', display: 'flex'}}>
        <TextField onChange={handleChange} name="costName" value={cost.costName} label="Add Cost" variant="outlined" />
        <FormControl sx={{ display: 'inline-block' }}>
          <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
          <OutlinedInput
            name="amount"
            value={cost.amount}
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            label="Amount"
            onChange={handleChange}
          />
        </FormControl>
        <TextField onChange={handleChange} name="month" value={cost.month} InputProps={{inputProps: { min: 1, max: 12 }}} type="number" label="Month" variant="outlined" />
        <TextField onChange={handleChange} name="year" value={cost.year} InputProps={{inputProps: { min: 1900, max: 2022 }}} type="number" label="Year" variant="outlined" />
        <Box sx={{ minWidth: 120, display: 'inline-block' }}>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Category</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              name="category"
              value={cost.category}
              label="Category"
              onChange={handleChange}
            >
              <MenuItem value={'Living'}>Living</MenuItem>
              <MenuItem value={'Car'}>Car Expenses</MenuItem>
              <MenuItem value={'Lifestyle'}>Life Style</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button onClick={handleSubmit} variant="contained" sx={{ margin:'10px' }}>Add</Button>
        </Card>
      </div>

      <div className="all-costs">
        
        <div className="filter-costs">
          <h3>Filter By Month and Year:</h3>
          <div className="filter">
            <TextField onChange={handleFilterChange} name="month" value={filterCosts.month} InputProps={{inputProps: { min: 1, max: 12 }}} type="number" label="Month" variant="outlined" />
            <TextField onChange={handleFilterChange} name="year" value={filterCosts.year} InputProps={{inputProps: { min: 1900, max: 2022 }}} type="number" label="Year" variant="outlined" />
            <Button onClick={handleFilter} variant="contained" sx={{ margin:'10px' }}>Filter</Button>
        </div>
        <h2>All Costs:</h2>
        </div>
        <div className="costs-wrapper">
          {allCosts?.map((cost) => (
            <Card sx={{ gap: '2px', padding: '20px', margin: '20px', display: 'flex', flexDirection: 'column'}} key={cost.costName} className="cost">
              <h4 className="cost-name">Description: </h4>  <span>{cost.costName}</span>
              <h4 className="cost-name">Price: </h4> <span>{cost.amount}$</span>
              <h4 className="cost-name">Month: </h4> <span>{cost.month}</span>
              <h4 className="cost-name">Year: </h4> <span>{cost.year}</span>
            </Card>
          ))}
        </div>
      </div>
    
    </div>
  );
}

export default App;
