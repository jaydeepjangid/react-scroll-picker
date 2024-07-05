import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './style.less';

const PickerColumn = ({ options, name, value, itemHeight, columnHeight, onChange }) => {
  const [state, setState] = useState({
    isMoving: false,
    startTouchY: 0,
    startScrollerTranslate: 0,
    ...computeTranslate()
  });

  const scrollerRef = useRef(null);

  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      ...computeTranslate()
    }));
  }, [value, options, itemHeight, columnHeight]);

  function computeTranslate() {
    let selectedIndex = options.findIndex(option => option.value === value);
    if (selectedIndex < 0) {
      console.warn(`Warning: "${name}" doesn't contain an option of "${value}".`);
      onValueSelected(options[0].value);
      selectedIndex = 0;
    }
    return {
      scrollerTranslate: columnHeight / 2 - itemHeight / 2 - selectedIndex * itemHeight,
      minTranslate: columnHeight / 2 - itemHeight * options.length + itemHeight / 2,
      maxTranslate: columnHeight / 2 - itemHeight / 2
    };
  }

  function onValueSelected(newValue) {
    onChange(name, newValue);
  }

  const handleTouchStart = useCallback((event) => {
    const startTouchY = event.targetTouches[0].pageY;
    setState(prevState => ({
      ...prevState,
      startTouchY,
      startScrollerTranslate: prevState.scrollerTranslate
    }));
  }, []);

  const handleTouchMove = useCallback((event) => {
    event.preventDefault();
    const touchY = event.targetTouches[0].pageY;
    setState(prevState => {
      if (!prevState.isMoving) {
        return { ...prevState, isMoving: true };
      }

      let nextScrollerTranslate = prevState.startScrollerTranslate + touchY - prevState.startTouchY;
      if (nextScrollerTranslate < prevState.minTranslate) {
        nextScrollerTranslate = prevState.minTranslate - Math.pow(prevState.minTranslate - nextScrollerTranslate, 0.8);
      } else if (nextScrollerTranslate > prevState.maxTranslate) {
        nextScrollerTranslate = prevState.maxTranslate + Math.pow(nextScrollerTranslate - prevState.maxTranslate, 0.8);
      }
      return { ...prevState, scrollerTranslate: nextScrollerTranslate };
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!state.isMoving) {
      return;
    }
    setState(prevState => ({
      ...prevState,
      isMoving: false,
      startTouchY: 0,
      startScrollerTranslate: 0
    }));
    setTimeout(() => {
      const activeIndex = Math.max(0, Math.floor((state.maxTranslate - state.scrollerTranslate) / itemHeight));
      onValueSelected(options[activeIndex].value);
    }, 0);
  }, [state.isMoving, state.maxTranslate, state.scrollerTranslate, itemHeight, onValueSelected, options]);

  const handleTouchCancel = useCallback(() => {
    if (!state.isMoving) {
      return;
    }
    setState(prevState => ({
      ...prevState,
      isMoving: false,
      startTouchY: 0,
      startScrollerTranslate: 0,
      scrollerTranslate: prevState.startScrollerTranslate
    }));
  }, [state.isMoving]);

  const handleItemClick = useCallback((option) => {
    if (option !== value) {
      onValueSelected(option);
    }
  }, [value, onValueSelected]);

  const renderItems = useCallback(() => {
    return options.map((option, index) => {
      const style = {
        height: itemHeight + 'px',
        lineHeight: itemHeight + 'px'
      };
      const className = `picker-item${option.value === value ? ' picker-item-selected' : ''}`;
      return (
        <div
          key={index}
          className={className}
          style={style}
          onClick={() => handleItemClick(option.value)}>{option.label}</div>
      );
    });
  }, [options, value, itemHeight, handleItemClick]);

  const translateString = `translate3d(0, ${state.scrollerTranslate}px, 0)`;
  const scrollerStyle = {
    transform: translateString,
    transitionDuration: state.isMoving ? '0ms' : undefined
  };

  return (
    <div className="picker-column">
      <div
        ref={scrollerRef}
        className="picker-scroller"
        style={scrollerStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}>
        {renderItems()}
      </div>
    </div>
  );
};

PickerColumn.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    label: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  })).isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  itemHeight: PropTypes.number.isRequired,
  columnHeight: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
};

const Picker = ({ optionGroups, valueGroups, onChange, itemHeight = 36, height = 216 }) => {
  const renderInner = () => {
    const highlightStyle = {
      height: itemHeight,
      marginTop: -(itemHeight / 2)
    };
    const columnNodes = Object.keys(optionGroups).map(name => (
      <PickerColumn
        key={name}
        name={name}
        options={optionGroups[name]}
        value={valueGroups[name]}
        itemHeight={itemHeight}
        columnHeight={height}
        onChange={onChange}
      />
    ));
    return (
      <div className="picker-inner">
        {columnNodes}
        <div className="picker-highlight" style={highlightStyle}></div>
      </div>
    );
  };

  const style = {
    height
  };

  return (
    <div className="picker-container" style={style}>
      {renderInner()}
    </div>
  );
};

Picker.propTypes = {
  optionGroups: PropTypes.object.isRequired,
  valueGroups: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  height: PropTypes.number
};

export default Picker;
