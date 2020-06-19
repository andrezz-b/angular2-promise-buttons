// import 'core-js/fn/object/entries';
import {Component, DebugElement, ElementRef} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {PromiseBtnDirective} from './promise-btn.directive';
import {userCfg} from './user-cfg';
import {By} from '@angular/platform-browser';
import {Observable} from 'rxjs';
import {delay} from 'rxjs/operators';
import * as BlueBird from 'bluebird';
import * as jQuery from 'jquery';

class MockElementRef extends ElementRef {
  constructor() {
    super(null);
    this.nativeElement = {};
  }
}

@Component({
  selector: 'test-component',
  template: ''
})
class TestComponent {
  testPromise: any;
  setPromise: any;
  isDisabled: any;
}


let testUserCfg: any;

describe('PromiseBtnDirective', () => {
  beforeEach(async(() => {
    testUserCfg = {};
    TestBed.configureTestingModule({
      declarations: [
        TestComponent,
        PromiseBtnDirective
      ],
      providers: [
        // more providers
        {
          provide: ElementRef,
          useClass: MockElementRef
        },
        {
          provide: userCfg, useValue: testUserCfg
        },
      ]
    });
  }));

  describe('runtimeCfg', () => {
    let fixture: ComponentFixture<TestComponent>;
    let buttonDebugElement: DebugElement;
    let buttonElement: HTMLButtonElement;
    let promiseBtnDirective: PromiseBtnDirective;

    beforeEach(() => {
      fixture = TestBed.overrideComponent(TestComponent, {
        set: {
          template: '<button (click)="setPromise && setPromise();" [promiseBtn]="testPromise">BUTTON_TEXT</button>'
        }
      }).createComponent(TestComponent);
      fixture.detectChanges();

      buttonDebugElement = fixture.debugElement.query(By.css('button'));
      buttonElement = (buttonDebugElement.nativeElement as HTMLButtonElement);
      promiseBtnDirective = buttonDebugElement.injector.get<PromiseBtnDirective>(PromiseBtnDirective);
    });

    describe('default cfg', () => {
      describe('basic init', () => {
        it('should create an instance', () => {
          expect(promiseBtnDirective).toBeDefined();
          expect(promiseBtnDirective.cfg).toBeDefined();
          // const directive = new PromiseBtnDirective({}, {});
          // expect(directive).toBeTruthy();
        });
        it('should append the spinner el to the button', () => {
          const spinnerEl = buttonElement.querySelector('span');
          expect(spinnerEl && spinnerEl.outerHTML).toBe('<span class="btn-spinner"></span>');
        });
        describe('should accept all promise-alike values', () => {
          const possibleValues = {
            'native Promise': () => new Promise((resolve) => {
              resolve();
            }),
            'jQuery Deferred': () => jQuery.Deferred((defer: any) => {
              defer.resolve();
            }),
            'jQuery Deferred Promise': () => jQuery.Deferred((defer: any) => {
              defer.resolve();
            }).promise(),
            'bluebird Promise': () => new BlueBird((resolve) => {
              resolve();
            }),
            'RxJs Observable': () => {
              const observable = new Observable((subscriber) => {
                subscriber.complete();
              });

              return observable.pipe(delay(0)).subscribe(
                () => {
                },
                () => {
                },
                () => {
                },
              );
            },
          };

          // Iterate over possible values
          for (const [description, getPromise] of (Object as any).entries(possibleValues)) {
            describe(`testing ${description}`, () => {
              beforeEach(() => {
                fixture.componentInstance.testPromise = getPromise();
                // test init before to be sure
                spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
                fixture.detectChanges();
              });

              it('should init the loading state', () => {
                expect(promiseBtnDirective.initLoadingState).toHaveBeenCalled();
              });
            });
          }
        });
        it('should convert RxJs Observable Subscription to Promise', () => {
          const observable = new Observable((subscriber) => {
            subscriber.complete();
          });
          fixture.componentInstance.testPromise = observable.pipe(delay(0)).subscribe(
            () => {
            },
            () => {
            },
            () => {
            },
          );
          fixture.detectChanges();
          expect(promiseBtnDirective.promise instanceof Promise).toBe(true);
        });
        it('should throw an error if an observable is passed directly', () => {
          const observable = new Observable((subscriber) => {
            subscriber.complete();
          });
          fixture.componentInstance.testPromise = observable;

          expect(() => {
            fixture.detectChanges();
          }).toThrowError('promiseBtn must be an instance of Subscription, instance of Observable given');
        });
        it('should do nothing with a closed subscription', () => {
          spyOn(promiseBtnDirective, 'initLoadingState');

          const observable = new Observable((subscriber) => {
            subscriber.complete();
          });
          // subscription will immediately complete and close
          fixture.componentInstance.testPromise = observable.subscribe(
            () => {
            },
            () => {
            },
            () => {
            },
          );
          fixture.detectChanges();

          expect(promiseBtnDirective.promise).toBe(undefined);
          expect(promiseBtnDirective.initLoadingState).not.toHaveBeenCalled();
        });
      });

      describe('when promise is passed after click', () => {
        beforeEach(() => {
          fixture.componentInstance.setPromise = () => {
            fixture.componentInstance.testPromise = new Promise(() => {
            });
          };
          fixture.detectChanges();

          // remove initial promise
          fixture.componentInstance.testPromise = null;
          fixture.detectChanges();

          // test init before to be sure
          spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
          fixture.detectChanges();

          buttonDebugElement.triggerEventHandler('click', null);
          fixture.detectChanges();
        });

        it('should init the loading state', () => {
          expect(promiseBtnDirective.initLoadingState).toHaveBeenCalled();
        });
        it('should add .is-loading class', async(() => {
          fixture.whenStable().then(() => {
            expect(buttonElement.className).toBe('is-loading');
          });
        }));
        it('should disable the button', async(() => {
          fixture.whenStable().then(() => {
            expect(buttonElement.getAttribute('disabled')).toBe('disabled');
          });
        }));
      });

      describe('once a promise is passed', () => {
        beforeEach(() => {
          fixture.componentInstance.testPromise = new Promise(() => {
          });
          spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
          fixture.detectChanges();
        });

        it('should init the loading state', () => {
          expect(promiseBtnDirective.initLoadingState).toHaveBeenCalled();
        });
        it('should add .is-loading class', async(() => {
          fixture.whenStable().then(() => {
            expect(buttonElement.className).toBe('is-loading');
          });
        }));
        it('should disable the button', async(() => {
          fixture.whenStable().then(() => {
            expect(buttonElement.getAttribute('disabled')).toBe('disabled');
          });
        }));
      });

      describe('once a passed promise is resolved', () => {
        let promise;
        let resolve: any;
        beforeEach(async(() => {
          promise = new Promise((res) => {
            resolve = res;
          });
          fixture.componentInstance.testPromise = promise;

          // test init before to be sure
          spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
          fixture.detectChanges();
          expect(promiseBtnDirective.initLoadingState).toHaveBeenCalled();

          fixture.whenStable().then(() => {
            spyOn(promiseBtnDirective, 'cancelLoadingStateIfPromiseAndMinDurationDone').and.callThrough();
            resolve();
          });
          fixture.detectChanges();
        }));

        it('should cancel the loading state', () => {
          expect(promiseBtnDirective.cancelLoadingStateIfPromiseAndMinDurationDone).toHaveBeenCalled();
        });
        it('should remove the .is-loading class', () => {
          expect(buttonElement.className).toBe('');
        });
        it('should enable the button', () => {
          expect(buttonElement.hasAttribute('disabled')).toBe(false);
        });
      });

      describe('once a passed promise is rejected', () => {
        let promise;
        let reject: any;
        beforeEach(async(() => {
          promise = new Promise((res, rej) => {
            reject = rej;
          });
          fixture.componentInstance.testPromise = promise;

          // test init before to be sure
          spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
          fixture.detectChanges();
          expect(promiseBtnDirective.initLoadingState).toHaveBeenCalled();

          fixture.whenStable().then(() => {
            spyOn(promiseBtnDirective, 'cancelLoadingStateIfPromiseAndMinDurationDone').and.callThrough();
            reject();
          });
          fixture.detectChanges();
        }));

        it('should cancel the loading state', () => {
          expect(promiseBtnDirective.cancelLoadingStateIfPromiseAndMinDurationDone).toHaveBeenCalled();
        });
        it('should remove the .is-loading class', () => {
          expect(buttonElement.className).toBe('');
        });
        it('should enable the button', () => {
          expect(buttonElement.hasAttribute('disabled')).toBe(false);
        });
      });

      describe('should do nothing when anything else than a promise is passed', () => {
        const possibleValues = {
          undefined,
          null: null,
          boolean: false,
          number: 1,
          NaN,
          array: [],
          object: {},
          'object, "then" is not a function': {then: true},
          'object, "then" is invalid function': {
            then: () => {
            }
          },
        };

        // Iterate over possible values
        for (const [description, promise] of (Object as any).entries(possibleValues)) {
          describe(`testing ${description}`, () => {
            beforeEach(() => {
              fixture.componentInstance.testPromise = promise;
              // test init before to be sure
              spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
              fixture.detectChanges();
            });

            it('should cancel the loading state', () => {
              expect(promiseBtnDirective.initLoadingState).not.toHaveBeenCalled();
            });
            it('should remove the .is-loading class', () => {
              expect(buttonElement.className).toBe('');
            });
            it('should enable the button', () => {
              expect(buttonElement.hasAttribute('disabled')).toBe(false);
            });
          });
        }
      });
    });

    describe('cfg:minDuration', () => {
      describe('once a passed promise is resolved but minDuration has not been exceeded', () => {
        let promise;
        let resolve: any;
        beforeEach((done) => {
          promiseBtnDirective.cfg.minDuration = 300;
          promise = new Promise((res) => {
            resolve = res;
          });
          fixture.componentInstance.testPromise = promise;

          // test init before to be sure
          spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
          fixture.detectChanges();
          expect(promiseBtnDirective.initLoadingState).toHaveBeenCalled();

          spyOn(promiseBtnDirective, 'cancelLoadingStateIfPromiseAndMinDurationDone').and.callThrough();
          setTimeout(() => {
            resolve();
            setTimeout(() => {
              done();
            }, 10);
          }, 10);
        });

        it('should try to cancel the loading state', () => {
          expect(promiseBtnDirective.cancelLoadingStateIfPromiseAndMinDurationDone).toHaveBeenCalled();
        });
        it('should not yet remove the .is-loading class', () => {
          expect(buttonElement.className).toBe('is-loading');
        });
        it('should not yet enable the button', () => {
          expect(buttonElement.hasAttribute('disabled')).toBe(true);
        });
      });

      describe('once a passed promise is resolved and the minDuration has been exceeded', () => {
        let promise;
        let resolve: any;
        beforeEach((done) => {
          promiseBtnDirective.cfg.minDuration = 30;
          promise = new Promise((res) => {
            resolve = res;
          });
          fixture.componentInstance.testPromise = promise;

          // test init before to be sure
          spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
          fixture.detectChanges();
          expect(promiseBtnDirective.initLoadingState).toHaveBeenCalled();

          spyOn(promiseBtnDirective, 'cancelLoadingStateIfPromiseAndMinDurationDone').and.callThrough();
          setTimeout(() => {
            resolve();
            setTimeout(() => {
              done();
            }, ((promiseBtnDirective.cfg.minDuration as number) + 5));
          }, 10);
        });

        it('should try to cancel the loading state', () => {
          expect(promiseBtnDirective.cancelLoadingStateIfPromiseAndMinDurationDone).toHaveBeenCalled();
        });
        it('should remove the .is-loading class', () => {
          expect(buttonElement.className).toBe('');
        });
        it('should enable the button', () => {
          expect(buttonElement.hasAttribute('disabled')).toBe(false);
        });
      });
    });

    describe('cfg:disableBtn:false once a promise is passed', () => {
      beforeEach(() => {
        promiseBtnDirective.cfg.disableBtn = false;
        fixture.componentInstance.testPromise = new Promise(() => {
        });
        spyOn(promiseBtnDirective, 'initLoadingState').and.callThrough();
        fixture.detectChanges();
      });

      it('should init the loading state', () => {
        expect(promiseBtnDirective.initLoadingState).toHaveBeenCalled();
      });
      it('should NOT disable the button', async(() => {
        expect(buttonElement.hasAttribute('disabled')).toBe(false);
      }));
    });

    describe('cfg:btnLoadingClass once a promise is passed', () => {
      it('should add a custom loading class', async(() => {
        spyOn(promiseBtnDirective, 'addLoadingClass').and.callThrough();
        promiseBtnDirective.cfg.btnLoadingClass = 'TEST';

        fixture.componentInstance.testPromise = new Promise(() => {
        });
        fixture.detectChanges();

        fixture.whenStable().then(() => {
          expect(promiseBtnDirective.addLoadingClass).toHaveBeenCalled();
          expect(buttonElement.className).toBe('TEST');
        });
      }));
      it('should not add a loading class if set to false', async(() => {
        spyOn(promiseBtnDirective, 'addLoadingClass').and.callThrough();

        promiseBtnDirective.cfg.btnLoadingClass = false;
        fixture.componentInstance.testPromise = new Promise(() => {
        });
        fixture.detectChanges();

        fixture.whenStable().then(() => {
          expect(buttonElement.className).toBe('');
        });
      }));
    });
  });

  describe('cfg:handleCurrentBtnOnly', () => {
    let fixture: ComponentFixture<TestComponent>;
    let buttonDebugElement: DebugElement;
    let divDebugElement: DebugElement;
    let buttonElement: HTMLButtonElement;
    let divElement: HTMLDivElement;
    let promiseBtnDirective1: PromiseBtnDirective;
    let promiseBtnDirective2: PromiseBtnDirective;

    beforeEach(() => {
      testUserCfg.handleCurrentBtnOnly = true;

      fixture = TestBed.overrideComponent(TestComponent, {
        set: {
          template: '<button [promiseBtn]="testPromise">1</button><div [promiseBtn]="testPromise">2</div>'
        }
      }).createComponent(TestComponent);
      fixture.detectChanges();
      buttonDebugElement = fixture.debugElement.query(By.css('button'));
      divDebugElement = fixture.debugElement.query(By.css('div'));
      buttonElement = (buttonDebugElement.nativeElement as HTMLButtonElement);
      divElement = (divDebugElement.nativeElement as HTMLDivElement);
      promiseBtnDirective1 = buttonDebugElement.injector.get<PromiseBtnDirective>(PromiseBtnDirective);
      promiseBtnDirective2 = divDebugElement.injector.get<PromiseBtnDirective>(PromiseBtnDirective);
      fixture.detectChanges();

      promiseBtnDirective1.cfg.handleCurrentBtnOnly = true;
      promiseBtnDirective2.cfg.handleCurrentBtnOnly = true;

      fixture.componentInstance.testPromise = new Promise(() => {
      });

      spyOn(promiseBtnDirective1, 'initLoadingState').and.callThrough();
      spyOn(promiseBtnDirective2, 'initLoadingState').and.callThrough();
      spyOn(promiseBtnDirective1, 'handleCurrentBtnOnly').and.callThrough();
      fixture.detectChanges();
    });

    it('should cancel the click handler when handleCurrentBtnOnly is false', async(() => {
      promiseBtnDirective1.cfg.handleCurrentBtnOnly = false;
      buttonElement.click();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(promiseBtnDirective1.handleCurrentBtnOnly()).toBe(true);
        expect(promiseBtnDirective1.initLoadingState).not.toHaveBeenCalled();
      });
    }));

    it('should set loading state for first button when clicked, but not for second', async(() => {
      buttonElement.click();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(promiseBtnDirective1.initLoadingState).toHaveBeenCalled();
        expect(promiseBtnDirective2.initLoadingState).not.toHaveBeenCalled();
      });
    }));

    it('should set loading state for second button when clicked, but not for first', async(() => {
      divElement.click();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(promiseBtnDirective1.initLoadingState).not.toHaveBeenCalled();
        expect(promiseBtnDirective2.initLoadingState).toHaveBeenCalled();
      });
    }));

    it('should set loading state when promise is set after click', async(() => {
      const setPromise = () => {
        fixture.componentInstance.testPromise = new Promise(() => {
        });
      };

      // remove initial promise
      fixture.componentInstance.testPromise = null;
      fixture.detectChanges();

      // add promise on click
      buttonElement.addEventListener('click', setPromise);
      fixture.detectChanges();

      buttonElement.click();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(promiseBtnDirective1.initLoadingState).toHaveBeenCalled();

        // cleanup
        buttonElement.removeEventListener('click', setPromise);
      });
    }));
  });

  describe('cfg before runtime', () => {
    let fixture: ComponentFixture<TestComponent>;
    let buttonDebugElement: DebugElement;
    let buttonElement: HTMLButtonElement;
    let promiseBtnDirective: PromiseBtnDirective;

    describe('cfg:spinnerTpl', () => {
      it('should add a custom template from config', () => {
        testUserCfg.spinnerTpl = '<div class="test">loading</div>';

        fixture = TestBed.overrideComponent(TestComponent, {
          set: {
            template: '<button [promiseBtn]="testPromise">BUTTON_TEXT</button>'
          }
        }).createComponent(TestComponent);
        fixture.detectChanges();
        buttonDebugElement = fixture.debugElement.query(By.css('button'));
        buttonElement = (buttonDebugElement.nativeElement as HTMLButtonElement);
        promiseBtnDirective = buttonDebugElement.injector.get<PromiseBtnDirective>(PromiseBtnDirective);
        fixture.detectChanges();

        const spinnerEl = buttonElement.querySelector('div');
        expect(spinnerEl && spinnerEl.outerHTML).toBe('<div class="test">loading</div>');
      });
    });
  });


  describe('simple boolean', () => {
    let fixture: ComponentFixture<TestComponent>;

    it('should not remove', () => {
      fixture = TestBed.overrideComponent(TestComponent, {
        set: {
          template: '<button [promiseBtn]="testPromise" [disabled]="isDisabled">BUTTON_TEXT</button>'
        }
      }).createComponent(TestComponent);
      const buttonDebugElement = fixture.debugElement.query(By.css('button'));
      const buttonElement = (buttonDebugElement.nativeElement as HTMLButtonElement);
      fixture.componentInstance.isDisabled = true;

      fixture.detectChanges();
      expect(buttonElement.hasAttribute('disabled')).toBe(true);
    });
  });
});

