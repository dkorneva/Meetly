const React = require("react");
const { View } = require("react-native");

// Заменяем только загрузку SVG; Icon и компоненты приложения остаются настоящими.
module.exports = function SvgMock(props) {
  return React.createElement(View, { ...props, testID: "svg-mock" });
};
