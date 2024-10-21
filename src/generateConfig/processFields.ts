function processFields(data) {
  const details = data['Details'].slice(1);
  return details.map(detail => ({
    tagKey: slugify(detail[0]),
    type: getFieldType(detail[2]),
    label: detail[0],
    placeholder: detail[1],
    options: getFieldOptions(detail[2], detail[3]),
    universal: detail[5] === 'TRUE'
  }));
}
