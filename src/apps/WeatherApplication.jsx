import React from 'react';
import PropTypes from 'prop-types';
import Yaml from 'js-yaml';
import isEqual from 'lodash/isEqual';
// OpenWeatherMap [https://openweathermap.org/]
// Please change to your own OpenWeatherMap API KEY in [../apikey/apikey.js]
import { openWeatherMapApiKey } from '../apikey/apikey';

const baseURL = 'http://api.openweathermap.org/data/2.5/weather';
const units = 'metric';
const iconURL = 'http://openweathermap.org/img/w/';

class WeatherModel {
  constructor() {
    this.country = '';
    this.city = '';
    this.weather = '';
    this.icon = '';
    this.temp = 0;
  }
  setWeather(data) {
    this.country = data.sys.country;
    this.city = data.name;
    this.weather = data.weather[0].main;
    this.icon = data.weather[0].icon;
    this.temp = data.main.temp;
  }
  equals(other) {
    return isEqual(this, other);
  }
  serialize() {
    return Yaml.safeDump(this);
  }
  static deserialize(str) {
    try {
      const obj = Yaml.safeLoad(str);
      const model = new WeatherModel();
      if (obj.country) model.country = obj.country;
      if (obj.city) model.city = obj.city;
      if (obj.weather) model.weather = obj.weather;
      if (obj.icon) model.icon = obj.icon;
      if (obj.temp) model.temp = obj.temp;
      return model;
    } catch (ex) {
      return new WeatherModel();
    }
  }
}

export default class WeatherApplication extends React.Component {
  constructor(props) {
    super();
    this.handleGetWeather = this.handleGetWeather.bind(this);
    this.state = { weather: WeatherModel.deserialize(props.data), errorMessage: '' };
  }
  componentWillReceiveProps(newProps) {
    if (this.props.data !== newProps.data) {
      const weather = WeatherModel.deserialize(newProps.data);
      this.setState({ weather });
    }
  }
  shouldComponentUpdate(newProps, nextState) {
    return !this.state.weather.equals(nextState.weather) || this.state.errorMessage !== nextState.errorMessage;
  }
  handleGetWeather() {
    const city = this.inputCity.value;
    if (!city) return;
    window.fetch(`${baseURL}?q=${city}&units=${units}&appid=${openWeatherMapApiKey}`)
      .then(response => response.json())
      .then((data) => {
        if (data.cod === 200) {
          this.state.weather.setWeather(data);
          this.forceUpdate();
          this.setState({ errorMessage: '' });
          this.props.onEdit(this.state.weather.serialize(), this.props.appContext);
        } else if (data.cod === 401) {
          this.setState({ errorMessage: `Get Weather Error [ ${data.message} Please change to your own OpenWeatherMap API KEY in [../apikey/apikey.js].]` });
        } else {
          this.setState({ errorMessage: `Get Weather Error [ ${data.message} ]` });
        }
      }).catch((e) => {
        this.setState({ errorMessage: `Get Weather Error [ ${e} ]` });
      });
  }
  render() {
    return (
      <div>
        <input ref={(input) => { this.inputCity = input; }} type="text" placeholder="Add City" />
        <input type="button" value="Get Current Weather" onClick={this.handleGetWeather} />
        <div key="error" style={{ color: '#D8000C' }}>{this.state.errorMessage}</div>
        <div key="result">
          { this.state.weather.city ? [
            `City: ${this.state.weather.city}, ${this.state.weather.country}`,
            <br />,
            `Weather: ${this.state.weather.weather}`,
            <img src={`${iconURL}${this.state.weather.icon}.png`} alt={this.state.weather.weather} width="24px" />,
            `Temperature: ${this.state.weather.temp}℃`,
          ] : null
          }
        </div>
      </div>);
  }
}

WeatherApplication.Model = WeatherModel;

WeatherApplication.propTypes = {
  data: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  appContext: PropTypes.shape({}).isRequired,
};
