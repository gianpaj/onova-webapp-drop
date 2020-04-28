import React from 'react';
import TextareaItem from 'antd-mobile/lib/textarea-item';
import { Card, Button, Icon, Input, InputNumber, Form, Radio, Tag, message } from 'antd';
import { Formik } from 'formik';
import { DropzoneComponent } from 'react-dropzone-component';
import Row from 'reactstrap/lib/Row';
import Col from 'reactstrap/lib/Col';
import Progress from 'reactstrap/lib/Progress';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import ImageCompressor from 'image-compressor.js';
import throttle from 'lodash.throttle';
import shallowEqual from 'fbjs/lib/shallowEqual';
import ReactDOMServer from 'react-dom/server';

import './ItemUploader.scss';

import * as ui from '../../utility/ui';
import { API_URL } from '../../utility/api';
import settings from '../../utility/settings';
import brands from '../../assets/brands.json';

const MIN_WIDTH = 1000;
const MIN_HEIGHT = 1000;

const componentConfig = {
  iconFiletypes: ['.jpg', '.png', '.gif'],
  // showFiletypeIcon: false,
  postUrl: `${API_URL}/api/photos/upload`,
};

type Props = {
  id: string;
  addItem: (formData: any) => void;
  onDeleteItem: (event: React.MouseEvent<HTMLInputElement>) => void;
  token: string;
};

interface State extends FormValues {
  fileList: Array<any>;
  isUploading: boolean;
  progress: number;
  ready: boolean;
  tags: Array<any>;
  tagsText: string;
  thumbnail: string;
}

interface FormValues {
  categoryIds: number;
  description: string;
  price: string;
  quantity: number;
  weight: string;
}

// window.__TESTING__ = false;

class ItemUploader extends React.Component<Props, State> {
  numberOfBrands = 0;
  batchNum = 0;
  state = {
    categoryIds: -1,
    description: '',
    fileList: [] as Array<any>,
    isUploading: false,
    price: '',
    progress: 0,
    quantity: 1,
    ready: false,
    tags: [],
    tagsText: '',
    thumbnail: '',
    weight: '100',
  };
  dropzone: any;
  setProgressThrottled: any;

  constructor(props: Props) {
    super(props);
    this.setProgressThrottled = throttle(this.setProgress, 200);
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return !shallowEqual(this.state, nextState);
  }

  componentWillUnmount() {
    this.setProgressThrottled.cancel();
  }

  // mockItem = (setFieldTouched: Function) => {
  //   const images = require('../temp-images');
  //   const files = [];
  //   for (let i = 0; i < 6; i++) {
  //     const random = Math.floor(Math.random() * Math.floor(images.length));
  //     const mockFile = {
  //       upload: {
  //         filename: 'banner' + i + '.jpg',
  //       },
  //       name: 'banner' + i + '.jpg',
  //       size: 12345,
  //       URL: images[random],
  //     };
  //     this.dropzone.files.push(mockFile);
  //     this.dropzone.emit('addedfile', mockFile);
  //     this.dropzone.options.thumbnail.call(this.dropzone, mockFile, mockFile.URL);
  //     this.dropzone.emit('complete', mockFile);
  //     files.push(mockFile);
  //   }

  //   const data = {
  //     id: this.props.id,
  //     categoryIds: '2',
  //     description: 'description',
  //     photos: files,
  //     price: '1111',
  //     tags: '["tag","tag2"]',
  //   };
  //   this.props.addItem(data);
  //   setFieldTouched('description', true);
  //   this.dropzone.disable();

  //   this.setState({ fileList: files });
  // };

  /**
   * After successfully uploaded
   */
  success = (file: any) => {
    const { fileList } = this.state;
    if (fileList.length === 6) {
      return message.warning("You can't upload more than 6 photos bro");
    }
    // get the filename of the stored file on the server
    const response = JSON.parse(file.xhr.response);
    // TODO: download thumb.jpeg for preview but send URL without thumb
    const thisFile = { ...file, URL: response.data };
    // console.log(thisFile);
    this.setState({
      fileList: [...fileList, thisFile],
    });
  };

  addedfile = async (originalFile: any) => {
    try {
      await this.checkImageDimensions(originalFile);
    } catch (error) {
      return message.error('Зображення занадто малі, мін 1000 px');
    }
    this.setState({ isUploading: true, progress: 100 });
    new ImageCompressor(originalFile, {
      quality: 0.9,
      // maxWidth: settings.MAX_IMAGE_WIDTH,
      // maxHeight: settings.MAX_IMAGE_HEIGHT,
      // PNG files over this value will be converted to JPEGs if over 5 MB
      convertSize: 5 * 1000 * 1000,
      // accept: (file, done) => console.log(file, done),
      success: (compressedFile: any) => {
        const perc = (compressedFile.size * 100) / originalFile.size;

        // If the compressed file size is at least 95% of the original file (or 5% smaller)
        if (perc < 96) {
          console.debug('using compressed file');
          const origFileIndex = this.dropzone.files.indexOf(originalFile);
          compressedFile.accepted = true;
          compressedFile.status = 'added';
          compressedFile.upload = {
            ...originalFile.upload,
            total: compressedFile.size,
          };
          this.dropzone.files[origFileIndex] = compressedFile;
        } else {
          console.debug('using original file');
        }
        console.debug(`the compressed image is ${100 - perc}% smaller`);
        console.debug(`originalFile: ${originalFile.size / 1000} kb`);
        console.debug(`compressedFile: ${compressedFile.size / 1000} kb`);

        this.dropzone.enqueueFile(compressedFile);

        this.dropzone.processQueue();
      },
      error(e) {
        console.error(e);
      },
    });
  };

  checkImageDimensions(file: File): Promise<null> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();

      fr.onload = function() {
        // file is loaded
        const img = new Image();

        img.onload = function() {
          if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
            return reject();
          }
          resolve();
        };

        if (typeof fr.result == 'string') img.src = fr.result; // is the data URL because called with readAsDataURL
      };

      fr.readAsDataURL(file);
    });
  }

  changeTagsTest = (e: any) => {
    return new Promise(resolve => {
      const tagsText = e.target.value;
      const textWithoutSeparators = tagsText.replace(/,|;| | \n/gi, '');

      const textHasBeenPasted = tagsText.split(' ').filter((s: string) => Boolean(s)).length > 1;
      if (textHasBeenPasted) {
        const onBrandTags = tagsText
          .split(' ')
          .filter(
            (s: string) =>
              Boolean(s) &&
              settings.HASHTAG_REGEX.test(s) &&
              s.length < settings.MAX_LENGTH_PER_TAG &&
              this.onlyOneBrand(s)
          );
        const uniqueTags = new Set([...this.state.tags, ...onBrandTags]);
        return this.setState(
          {
            tags: Array.from(uniqueTags).slice(0, settings.MAX_TAGS),
            tagsText: '',
          },
          () => resolve()
        );
      }

      const found = this.state.tags.some(r => brands.brands.indexOf(r) >= 0);
      if (!found) this.numberOfBrands = 0;

      // if the tag is longer the maximum
      // OR if it doesn't match the regex
      if (
        textWithoutSeparators.length > settings.MAX_LENGTH_PER_TAG ||
        !settings.HASHTAG_REGEX.test(textWithoutSeparators)
      )
        return;

      const lastTyped = tagsText.charAt(tagsText.length - 1);
      const parseWhen = [',', ' ', ';', '\n'];

      // if a separator was typed at the end of the tag
      // AND the tag has the minimum length
      if (
        parseWhen.indexOf(lastTyped) > -1 &&
        textWithoutSeparators.length >= settings.MIN_LENGTH_PER_TAG &&
        this.state.tags.length < settings.MAX_TAGS &&
        this.onlyOneBrand(this.state.tagsText)
      ) {
        const newTags = new Set([...this.state.tags, this.state.tagsText]);
        return this.setState(
          {
            tags: Array.from(newTags),
            tagsText: '',
          },
          () => resolve()
        );
      }
      this.setState({ tagsText: textWithoutSeparators });
    });
  };

  /**
   * if a brand is typed, allow only one to be added
   */
  onlyOneBrand(text: string): boolean {
    text = text.toLowerCase();
    if (brands.brands.indexOf(text) === -1) return true;
    if (brands.brands.indexOf(text) > -1 && this.numberOfBrands < settings.MAX_BRAND_TAGS) {
      this.numberOfBrands++;
      return true;
    }
    return false;
  }

  handleClose = (removedTag: string) => {
    this.setState(prevState => {
      const filteredTags = prevState.tags.filter(tag => tag !== removedTag);
      const found = filteredTags.some(r => brands.brands.indexOf(r) >= 0);
      if (!found) this.numberOfBrands = 0;
      return { tags: filteredTags };
    });
  };

  onSubmit = async (
    values: FormValues,
    {
      setSubmitting,
    }: // setErrors,
    {
      setSubmitting: (isSubmitting: boolean) => void;
      // setErrors: (fields: { [field: string]: string }) => void;
    }
  ) => {
    const { categoryIds, description, price, quantity, weight } = values;
    const { fileList, tags, tagsText } = this.state;

    // this.setState({ tagsText: '' });
    // const formData = new FormData();
    // fileList.forEach(f => {
    //   formData.append('photos', f.URL);
    // });
    // formData.append('description', description);
    // formData.append('price', price.toString());
    // formData.append('categoryIds', categoryIds.toString());
    // if (tags.length) formData.append('tags', JSON.stringify(tags));

    if (!fileList.length) {
      return;
    }

    if (tagsText.length) {
      await this.changeTagsTest({ target: { value: tagsText + ',' } });
    }

    const data: any = {
      id: this.props.id,
      categoryIds: categoryIds.toString(),
      description,
      photos: fileList.map(f => f.URL),
      price: price.toString(),
      quantity: quantity,
      weight: parseInt(weight),
    };
    if (tags.length) data.tags = JSON.stringify(tags);

    console.debug(data);
    this.props.addItem(data);
    // for enable/disabling
    this.setState({ description, price, categoryIds, quantity, weight, ready: true });
    setSubmitting(true);
    this.dropzone.disable();
  };

  onValidate = (values: FormValues) => {
    const { price, description, categoryIds, quantity, weight } = values;
    const errors: any = {};

    if (!price) {
      errors.price = "Обов'язково";
      // errors.price = 'Required';
    } else if (!settings.PRICE_REGEX.test(price)) {
      errors.price = 'Недійсна ціна';
      // errors.price = 'Invalid price';
    }

    if (!description) {
      errors.description = "Обов'язково";
      // errors.description = 'Required';
    } else if (description.trim().length < settings.MIN_LENGTH_DESCRIPTION) {
      errors.description = 'напишіть довший опис';
      // errors.description = 'Write a longer description';
    }

    if (categoryIds < 0) {
      errors.categoryIds = "Обов'язково";
      // errors.categoryIds = 'Required';
    }

    if (quantity < 1) {
      errors.quantity = 'Мінімальна кількість 1';
      // errors.quantity = 'Minimum quantity 1';
    }

    if (!weight || parseInt(weight) > settings.MAX_WEIGHT || parseInt(weight) < settings.MIN_WEIGHT) {
      errors.weight = 'bad weight';
    }

    return errors;
  };

  onRemoveFile = (index: number) => this.setState({ fileList: this.state.fileList.filter((_, i) => i !== index) });

  onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    this.setState({ fileList: arrayMove(this.state.fileList, oldIndex, newIndex) });
    setTimeout(() => {
      this.dropzone.enable();
    }, 300);
  };

  setProgress = (perc: number) => {
    if (perc === 100) this.setState({ isUploading: false });
    this.setState({ progress: perc });
  };

  onEdit = () => {
    this.dropzone.enable();
    this.setState({ ready: false });
  };

  renderReady(
    resetForm: () => void,
    setFieldTouched: {
      (
        field: 'description' | 'categoryIds' | 'price' | 'quantity' | 'weight',
        isTouched?: boolean | undefined,
        shouldValidate?: boolean | undefined
      ): void;
      (field: string, isTouched?: boolean | undefined): void;
      (arg0: string, arg1: boolean): void;
    }
  ) {
    const { fileList } = this.state;
    return (
      <div className="readyContainer">
        <div className="readyPhoto">
          <img
            src={fileList[0].URL.replace('.jpg', '-thumb.jpg')}
            alt={fileList[0].upload.filename}
            title={fileList[0].upload.filename}
          />
        </div>
        <Row
          style={{
            alignItems: 'center',
            paddingBottom: 0,
            paddingTop: 20,
          }}>
          <Col xs={6}>
            <Button
              icon="edit"
              type="primary"
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => {
                this.onEdit();
                resetForm();
                setFieldTouched('description', true);
              }}
            />
          </Col>
          <Col xs={6}>
            <Button
              // style={{ borderWidth: 0 }}
              icon="delete"
              // theme="filled"
              onClick={this.props.onDeleteItem}
            />
          </Col>
        </Row>
      </div>
    );
  }

  render() {
    const {
      categoryIds,
      description,
      fileList,
      isUploading,
      price,
      quantity,
      progress,
      ready,
      tags,
      tagsText,
      weight,
    } = this.state;
    const { id, token } = this.props;

    return (
      <Card bordered={false}>
        <Formik
          initialValues={{
            description,
            categoryIds,
            price,
            quantity,
            weight,
          }}
          validateOnChange={false}
          validate={this.onValidate}
          isInitialValid
          onSubmit={this.onSubmit}
          // eslint-disable-next-line react/jsx-no-bind
          render={({
            values,
            errors,
            touched,
            setFieldValue,
            setFieldTouched,
            handleBlur,
            handleSubmit,
            // isValid,
            isSubmitting,
            resetForm,
          }) => {
            if (ready) return this.renderReady(resetForm, setFieldTouched);
            return (
              <form onSubmit={handleSubmit}>
                <DropzoneComponent
                  config={componentConfig}
                  eventHandlers={{
                    // if (window.__TESTING__) this.mockItem(setFieldTouched);
                    init: (dz: any) => (this.dropzone = dz),
                    success: this.success,
                    addedfile: this.addedfile,
                    processing: () => {
                      // one file starts uploading
                      // console.time(`upload time ${id}-batch-${this.batchNum}`);
                      this.setState({ isUploading: true, progress: 0 });
                    },
                    totaluploadprogress: this.setProgressThrottled,
                    complete: () => {
                      this.dropzone.processQueue(); // process next queued file
                      // console.timeEnd(`upload time ${id}-batch-${this.batchNum}`);
                      // this.batchNum++;
                      this.setState({ isUploading: false, progress: 0 });
                    },
                    error: e => {
                      if (e && e.xhr && e.xhr.response) {
                        const res = JSON.parse(e.xhr.response);
                        if (res.message.startsWith('Image too small')) {
                          return message.error('Зображення занадто малі, мін 1000 px');
                        }
                      }
                      console.error(e);
                      message.error('Error uploading image');
                      this.setState({ isUploading: false, progress: 0 });
                    },
                    // maxfilesexceeded: () =>
                    //   message.error("You can't upload more than 6 photos bro"),
                  }}
                  // For a full list of possible configurations,
                  // please consult http://www.dropzonejs.com/#configuration
                  djsConfig={{
                    autoQueue: false,
                    autoProcessQueue: false,
                    dictFileTooBig: 'The photo is too large, bro',
                    addRemoveLinks: false,
                    acceptedFiles: 'image/*',
                    createImageThumbnails: false,
                    dropzoneSelector: '.dz-dropzone',
                    parallelUploads: 1,
                    // maxFiles: 6,
                    previewTemplate: ReactDOMServer.renderToStaticMarkup(
                      <div className="dz-file-preview">
                        <div className="dz-error-message">
                          <span data-dz-errormessage="true" />
                        </div>
                      </div>
                    ),
                    paramName: 'photo',
                    timeout: 0,
                    headers: { Authorization: token },
                  }}>
                  <div
                    className={
                      'dz-dropzone ' + (fileList.length ? '' : 'dz-dropzone-empty') + (isSubmitting ? 'dz-ready' : '')
                    }>
                    {!fileList.length && !isUploading && (
                      <div className="dz-message">
                        <Icon type="camera-o" style={{ fontSize: 24, verticalAlign: 'bottom' }} />{' '}
                        <span>max 6 зображень</span>
                      </div>
                    )}
                    {(isUploading || progress > 0) && (
                      <div className="progress">
                        <Progress color="old-blue" animated bar value={progress} />
                      </div>
                    )}
                    {!isSubmitting ? (
                      <SortableList
                        axis="x"
                        items={fileList}
                        onSortEnd={this.onSortEnd}
                        onRemoveFile={this.onRemoveFile}
                        // eslint-disable-next-line react/jsx-no-bind
                        onSortStart={() => this.dropzone.disable()}
                      />
                    ) : (
                      <ul className="images">
                        {fileList.map((f, i) => (
                          <div key={i} className="photoContainer">
                            <img
                              src={f.URL.replace('.jpg', '-thumb.jpg')}
                              alt={f.upload.filename}
                              title={f.upload.filename}
                            />
                          </div>
                        ))}
                      </ul>
                    )}
                  </div>
                </DropzoneComponent>
                <Form.Item validateStatus={touched.price && errors.price ? 'error' : ''}>
                  {/* TODO: add in about commission % (same as in Mobile app) */}
                  <InputNumber
                    disabled={isSubmitting}
                    // eslint-disable-next-line react/jsx-no-bind
                    formatter={v => `₴ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    id="price"
                    min={settings.MIN_PRICE}
                    onBlur={handleBlur}
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={v => setFieldValue('price', v)}
                    // parser={(v: string | undefined) => v && parseInt(v.replace(/₴\s?|(,*)/g, ''))}
                    value={values.price ? parseInt(values.price) : undefined}
                  />
                </Form.Item>
                <Form.Item validateStatus={touched.quantity && errors.quantity ? 'error' : ''}>
                  <Row>
                    <Col className="d-inline-flex">
                      <InputNumber
                        disabled={isSubmitting}
                        id="quantity"
                        min={100}
                        max={1000}
                        onBlur={handleBlur}
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange={v => setFieldValue('quantity', v)}
                        value={Number.isInteger(values.quantity) ? values.quantity : undefined}
                      />
                      <Col className="align-self-center mt-3">
                        <span>Наявна кількість на продаж</span>
                      </Col>
                    </Col>
                  </Row>
                </Form.Item>
                <Form.Item validateStatus={touched.weight && errors.weight ? 'error' : ''}>
                  <Row>
                    <Col className="d-inline-flex">
                      <InputNumber
                        disabled={isSubmitting}
                        id="weight"
                        min={settings.MIN_WEIGHT}
                        max={settings.MAX_WEIGHT}
                        onBlur={handleBlur}
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange={v => setFieldValue('weight', v)}
                        value={values.weight ? parseInt(values.weight) : undefined}
                      />
                      <Col className="align-self-center mt-3">
                        <span>Вага посилки, гр</span>
                      </Col>
                    </Col>
                  </Row>
                </Form.Item>
                <Form.Item validateStatus={touched.description && errors.description ? 'error' : ''}>
                  <TextareaItem
                    // editable={!saved}
                    disabled={isSubmitting}
                    rows={5}
                    style={{ width: '100%' }}
                    count={settings.MAX_LENGTH_DESCRIPTION}
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={v => setFieldValue('description', v)}
                    // eslint-disable-next-line react/jsx-no-bind
                    onBlur={() => setFieldTouched('description', true)}
                    placeholder="Опис товару, склад товару, кількість товару(вага/об'єм/тощо)"
                    value={values.description}
                  />
                </Form.Item>
                <div style={{ display: 'block' }}>
                  <div
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      paddingBottom: 10,
                    }}>
                    {tags.map(t => (
                      // eslint-disable-next-line react/jsx-no-bind
                      <Tag key={t} closable={!isSubmitting} onClose={() => this.handleClose(t)}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                  <Form.Item validateStatus={tags.length >= settings.MAX_TAGS ? 'error' : ''}>
                    <Input
                      id="tag-search" // 'search' is to disable LastPass extension to autofill
                      autoComplete="off"
                      size="small"
                      placeholder="#tags"
                      value={tagsText}
                      onChange={this.changeTagsTest}
                      disabled={isSubmitting || tags.length >= settings.MAX_TAGS}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
                <div style={{ paddingTop: 10, paddingBottom: 5 }}>
                  <Form.Item validateStatus={touched.categoryIds && errors.categoryIds ? 'error' : ''}>
                    <Radio.Group
                      disabled={isSubmitting}
                      // eslint-disable-next-line react/jsx-no-bind
                      onChange={e => {
                        setFieldTouched('categoryIds', true);
                        setFieldValue('categoryIds', e.target.value);
                      }}
                      value={values.categoryIds}
                      style={{ display: 'block' }}>
                      <>
                        {ui.category_radio_grp_1.map((g, i) => (
                          <Radio key={i} value={g.value}>
                            {g.label}
                          </Radio>
                        ))}
                        <div style={{ paddingTop: 5 }}>
                          {ui.category_radio_grp_2.map((g, i) => (
                            <Radio key={i} value={g.value}>
                              {g.label}
                            </Radio>
                          ))}
                        </div>
                        <div style={{ paddingTop: 5 }}>
                          {ui.category_radio_grp_3.map((g, i) => (
                            <Radio key={i} value={g.value}>
                              {g.label}
                            </Radio>
                          ))}
                        </div>
                      </>
                    </Radio.Group>
                  </Form.Item>
                </div>
                <Row
                  style={{
                    alignItems: 'center',
                    paddingBottom: 0,
                    paddingTop: 20,
                  }}>
                  <Col>
                    <Button
                      type="primary"
                      htmlType="submit"
                      onClick={handleSubmit}
                      disabled={
                        // !(isValid && fileList.length) ||
                        !fileList.length || isSubmitting || isUploading
                      }>
                      {/* done / ready */}
                      Підготовлено
                    </Button>
                  </Col>
                </Row>
              </form>
            );
          }}
        />
      </Card>
    );
  }
}

export default ItemUploader;

const SortableItem = SortableElement(({ value, onRemoveFile, disabled }: any) => (
  <div className="photoContainer">
    <img
      // className={`${disabled ? 'disabled': ''}`}
      className={disabled ? 'disabled' : ''}
      src={value.URL.replace('.jpg', '-thumb.jpg')}
      alt={value.upload.filename}
      title={value.upload.filename}
    />
    <Button className="removeButton" onClick={onRemoveFile}>
      <Icon type="cross" style={{ fontSize: 20, color: 'white' }} />
    </Button>
  </div>
));

const SortableList = SortableContainer(({ items, onRemoveFile, disabled }: any) => (
  <ul className={items.length ? 'images' : ''}>
    {items.map((f: any, index: number) => (
      <SortableItem
        key={`item-${index}`}
        index={index}
        value={f}
        // eslint-disable-next-line react/jsx-no-bind
        onRemoveFile={() => onRemoveFile(index)}
        disabled={disabled} // for disabling the sorting and to pass it to SortableItem for the style
      />
    ))}
  </ul>
));
